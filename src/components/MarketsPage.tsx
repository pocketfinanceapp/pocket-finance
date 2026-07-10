"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { MarketFilter } from "@/lib/filters";
import { fuzzyMatchesQuery } from "@/lib/fuzzySearch";
import {
  countMarketMovers,
  formatIndexValue,
  getGlobalMarketStatus,
  getMarketSparkline,
  getMarketsByRegion,
  GLOBAL_MARKETS,
  MARKET_REGIONS,
  type GlobalMarket,
} from "@/lib/markets";
import {
  panelEnterStyle,
  tabEnterFadeStyle,
  tabEnterStyle,
  tabStaggerStyle,
  TAB_ENTER_EASE,
  useTabPageEntered,
} from "@/lib/tabEnterAnimation";
import { GlobalIndexesSection } from "./GlobalIndexesSection";
import { MarketPanel } from "./MarketPanel";
import { MarketSparkline } from "./MarketSparkline";
import { TopMoversSection } from "./TopMoversSection";

interface MarketsPageProps {
  onOpenMarketFeed: (market: MarketFilter) => void;
}

const SECTION_HEADING =
  "px-0 pb-2 text-xs font-semibold uppercase tracking-widest text-pocket-muted";

function filterMarkets(markets: GlobalMarket[], query: string): GlobalMarket[] {
  const q = query.trim();
  if (!q) return markets;
  return markets.filter((market) =>
    fuzzyMatchesQuery(q, [
      market.id,
      market.name,
      market.fullName,
      market.indexName,
      market.country,
    ])
  );
}

function MarketSummaryBar({
  movers,
  session,
}: {
  movers: { up: number; down: number };
  session: { open: boolean; label: "Markets open" | "Markets closed" };
}) {
  return (
    <div className="rounded-2xl pf-card-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-pocket-green" aria-hidden>
              ▲
            </span>
            <span className="text-sm font-bold tabular-nums text-pocket-green">
              {movers.up}
            </span>
            <span className="text-xs text-pocket-muted">up</span>
          </div>
          <div className="h-4 w-px bg-[var(--pocket-border)]" aria-hidden />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-pocket-red" aria-hidden>
              ▼
            </span>
            <span className="text-sm font-bold tabular-nums text-pocket-red">
              {movers.down}
            </span>
            <span className="text-xs text-pocket-muted">down</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              session.open ? "bg-pocket-green" : "bg-pocket-muted"
            }`}
            aria-hidden
          />
          <span className="text-xs font-medium text-pocket-muted">
            {session.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function MarketListCard({
  market,
  index,
  entered,
  onOpen,
}: {
  market: GlobalMarket;
  index: number;
  entered: boolean;
  onOpen: () => void;
}) {
  const up = market.changePercent >= 0;
  const sparkline = useMemo(() => getMarketSparkline(market), [market]);

  return (
    <button
      type="button"
      data-no-drag
      onClick={onOpen}
      className="pf-card-surface flex w-full items-center gap-3 rounded-2xl border border-[var(--pocket-border)] px-4 py-3.5 text-left transition-transform duration-300 active:scale-[0.98]"
      style={tabStaggerStyle(entered, index, 50)}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--pocket-surface-hover)] text-2xl leading-none">
        {market.flag}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold tracking-tight text-pocket-text">
          {market.name}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-pocket-muted">
          {market.fullName}
        </p>
        <p className="mt-1 truncate text-[11px] text-pocket-muted">
          {market.indexName}
        </p>
      </div>

      <MarketSparkline points={sparkline} up={up} />

      <div className="shrink-0 text-right">
        <p className="text-[14px] font-semibold tabular-nums text-pocket-text">
          {formatIndexValue(market.value)}
        </p>
        <span
          className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
            up
              ? "bg-[#00C6C6]/15 text-[#00C6C6]"
              : "bg-red-400/15 text-red-400"
          }`}
        >
          {up ? "+" : ""}
          {market.changePercent.toFixed(2)}%
        </span>
      </div>
    </button>
  );
}

export function MarketsPage({ onOpenMarketFeed }: MarketsPageProps) {
  const { ensureMarketsLoaded } = useApp();
  const tabEntered = useTabPageEntered("markets");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [panelMarket, setPanelMarket] = useState<MarketFilter | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [listVisible, setListVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensureMarketsLoaded();
  }, [ensureMarketsLoaded]);

  const movers = useMemo(() => countMarketMovers(), []);
  const session = useMemo(() => getGlobalMarketStatus(), []);

  const regions = useMemo(
    () =>
      MARKET_REGIONS.map((region) => ({
        ...region,
        markets: getMarketsByRegion(region).sort((a, b) =>
          a.name.localeCompare(b.name)
        ),
      })),
    []
  );

  const flatMarkets = useMemo(() => {
    const byId = new Map(GLOBAL_MARKETS.map((market) => [market.id, market]));
    const ordered: GlobalMarket[] = [];
    for (const region of MARKET_REGIONS) {
      for (const id of region.marketIds) {
        const market = byId.get(id);
        if (market) ordered.push(market);
      }
    }
    return ordered;
  }, []);

  const isSearching = searchQuery.trim().length > 0;
  const displayMarkets = useMemo(
    () => filterMarkets(flatMarkets, searchQuery),
    [flatMarkets, searchQuery]
  );

  const openMarket = (marketId: MarketFilter) => {
    setListVisible(false);
    window.setTimeout(() => {
      setPanelMarket(marketId);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPanelVisible(true));
      });
    }, 220);
  };

  const closePanel = () => {
    setPanelVisible(false);
    window.setTimeout(() => {
      setPanelMarket(null);
      window.requestAnimationFrame(() => setListVisible(true));
    }, 380);
  };

  if (panelMarket) {
    return (
      <div className="pf-page h-full bg-pocket-bg" style={panelEnterStyle(panelVisible)}>
        <MarketPanel
          marketId={panelMarket}
          onBack={closePanel}
          onOpenFeed={onOpenMarketFeed}
        />
      </div>
    );
  }

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      <header
        className="shrink-0 px-4 pb-3"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          ...tabEnterStyle(tabEntered, 0),
        }}
      >
        <h1 className="text-[28px] font-bold tracking-tight text-pocket-text">
          Markets
        </h1>
        <p
          className="mt-0.5 text-[13px] text-pocket-muted"
          style={tabEnterFadeStyle(tabEntered, 40)}
        >
          Global exchanges, indexes, and movers
        </p>

        <div className="relative mt-4" style={tabEnterStyle(tabEntered, 80)}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pocket-muted" />
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search market or exchange…"
            className={`w-full rounded-2xl border bg-[var(--pocket-surface-hover)] py-3 pl-10 pr-10 text-[14px] text-pocket-text outline-none transition-all duration-500 placeholder:text-pocket-muted ${
              searchFocused
                ? "border-[#00C6C6]/50 shadow-[0_0_0_3px_rgba(0,198,198,0.12)]"
                : "border-[var(--pocket-border)]"
            }`}
            style={{ transitionTimingFunction: TAB_ENTER_EASE }}
          />
          {searchQuery && (
            <button
              type="button"
              data-no-drag
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-pocket-muted transition-colors duration-300 active:text-pocket-text"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] transition-opacity duration-500"
        style={{
          opacity: listVisible ? 1 : 0,
          transitionTimingFunction: TAB_ENTER_EASE,
        }}
      >
        {!isSearching && (
          <>
            <div style={tabEnterStyle(tabEntered, 120)}>
              <MarketSummaryBar movers={movers} session={session} />
            </div>
            <div style={tabEnterStyle(tabEntered, 180)}>
              <GlobalIndexesSection />
            </div>
            <div style={tabEnterStyle(tabEntered, 240)}>
              <TopMoversSection />
            </div>
          </>
        )}

        {isSearching ? (
          displayMarkets.length === 0 ? (
            <p
              className="px-1 pt-8 text-center text-[14px] text-pocket-muted"
              style={tabEnterFadeStyle(tabEntered, 120)}
            >
              No markets match &ldquo;{searchQuery.trim()}&rdquo;
            </p>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {displayMarkets.map((market, index) => (
                <MarketListCard
                  key={market.id}
                  market={market}
                  index={index}
                  entered={tabEntered && listVisible}
                  onOpen={() => openMarket(market.id)}
                />
              ))}
            </div>
          )
        ) : (
          regions.map((region, regionIndex) => (
            <section
              key={region.id}
              className="mt-5"
              style={tabEnterStyle(tabEntered, 300 + regionIndex * 60)}
            >
              <h2 className={SECTION_HEADING}>{region.label}</h2>
              <div className="mt-2 flex flex-col gap-3">
                {region.markets.map((market, index) => (
                  <MarketListCard
                    key={market.id}
                    market={market}
                    index={index}
                    entered={tabEntered && listVisible}
                    onOpen={() => openMarket(market.id)}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {!isSearching && (
          <p
            className="mt-6 px-1 pb-1 text-center text-[11px] leading-relaxed text-pocket-muted"
            style={tabEnterStyle(tabEntered, 540)}
          >
            Market data is provided for informational purposes only and should
            not be considered investment advice.
          </p>
        )}
      </div>
    </div>
  );
}
