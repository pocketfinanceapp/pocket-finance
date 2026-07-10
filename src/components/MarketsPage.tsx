"use client";

import { useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { tabEnterFadeStyle, tabEnterStyle, tabStaggerStyle, TAB_ENTER_EASE, useTabPageEntered } from "@/lib/tabEnterAnimation";
import type { MarketFilter } from "@/lib/filters";
import { fuzzyMatchesQuery } from "@/lib/fuzzySearch";
import {
  formatIndexValue,
  GLOBAL_MARKETS,
  MARKET_REGIONS,
  type GlobalMarket,
} from "@/lib/markets";

interface MarketsPageProps {
  onOpenMarketFeed: (market: MarketFilter) => void;
}

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

  return (
    <button
      type="button"
      data-no-drag
      onClick={onOpen}
      className="pf-card-surface flex w-full items-center gap-3.5 rounded-2xl border border-[var(--pocket-border)] px-4 py-3.5 text-left transition-transform duration-300 active:scale-[0.98]"
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
  const tabEntered = useTabPageEntered("markets");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const orderedMarkets = useMemo(() => {
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

  const displayMarkets = useMemo(
    () => filterMarkets(orderedMarkets, searchQuery),
    [orderedMarkets, searchQuery]
  );

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
          Browse global exchanges and open a market feed
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        {searchQuery.trim() && displayMarkets.length === 0 ? (
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
                entered={tabEntered}
                onOpen={() => onOpenMarketFeed(market.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
