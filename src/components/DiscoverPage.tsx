"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { MarketFilter } from "@/lib/filters";
import {
  filterExploreCompanies,
  getExploreCompanies,
  type ExploreCompany,
} from "@/lib/exploreCompanies";
import { getCryptoAssets } from "@/lib/cryptoAssets";
import {
  buildFeedPersonalizationInput,
  rankExploreCompanies,
} from "@/lib/feedPersonalization";
import { fuzzyMatchesQuery } from "@/lib/fuzzySearch";
import { prefetchCompanyLogos } from "@/lib/logoCache";
import {
  formatIndexValue,
  getMarketSparkline,
  GLOBAL_MARKETS,
  MARKET_REGIONS,
  type GlobalMarket,
} from "@/lib/markets";
import { getStockProfile } from "@/lib/stockData";
import { fetchStockQuote } from "@/lib/stockQuoteClient";
import type { NewsArticle } from "@/lib/types";
import {
  loadFavouriteTopics,
  PF_TOPICS_CHANGED_EVENT,
} from "@/lib/profileStorage";
import {
  listLayerStyle,
  panelEnterStyle,
  tabEnterFadeStyle,
  tabEnterStyle,
  tabStaggerStyle,
  TAB_ENTER_EASE,
  TAB_EXIT_EASE,
  usePanelTransition,
  useTabPageEntered,
} from "@/lib/tabEnterAnimation";
import { CompanyLogo } from "./CompanyLogo";
import { BrowseAssetTabs } from "./BrowseAssetTabs";
import { MarketFlag } from "./MarketFlag";
import { MarketPanel } from "./MarketPanel";
import { MarketSparkline } from "./MarketSparkline";

type BrowseAssetTab = "companies" | "markets" | "crypto";

interface DiscoverPageProps {
  articles: NewsArticle[];
  onOpenCompany: (ticker: string) => void;
  onOpenMarketFeed: (market: MarketFilter) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function useLiveQuote(ticker: string) {
  const profile = useMemo(() => getStockProfile(ticker), [ticker]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveChangePct, setLiveChangePct] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchStockQuote(ticker).then((quote) => {
      if (cancelled || !quote) return;
      if (typeof quote.price === "number") setLivePrice(quote.price);
      if (typeof quote.changePercent === "number") {
        setLiveChangePct(quote.changePercent);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  return {
    price: livePrice ?? profile.price,
    changePercent: liveChangePct ?? profile.changePercent,
    logoColor: profile.logoColor,
    name: profile.name,
  };
}

function CompanyCard({
  company,
  index,
  entered,
  onOpen,
}: {
  company: ExploreCompany;
  index: number;
  entered: boolean;
  onOpen: () => void;
}) {
  const quote = useLiveQuote(company.ticker);
  const positive = quote.changePercent >= 0;

  return (
    <button
      type="button"
      data-no-drag
      onClick={onOpen}
      className="pf-card-surface group flex min-h-[128px] w-full flex-col rounded-2xl border border-[var(--pocket-border)] p-3.5 text-left transition-transform duration-300 active:scale-[0.97]"
      style={tabStaggerStyle(entered, index, 60)}
    >
      <div className="flex items-start justify-between gap-2">
        <CompanyLogo
          ticker={company.ticker}
          color={quote.logoColor}
          size={40}
          shape="square"
        />
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
            positive
              ? "bg-[#00C6C6]/15 text-[#00C6C6]"
              : "bg-red-400/15 text-red-400"
          }`}
        >
          {positive ? "+" : ""}
          {quote.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="mt-3 min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold tracking-tight text-pocket-text">
          {company.ticker}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-pocket-muted">
          {company.meta.companyName}
        </p>
      </div>

      <p className="mt-2 text-[13px] font-semibold text-pocket-text">
        ${formatPrice(quote.price)}
      </p>
    </button>
  );
}

function MarketBrowseCard({
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
      className="pf-card-surface flex w-full items-center gap-3 rounded-2xl border border-[var(--pocket-border)] px-3.5 py-2.5 text-left transition-transform duration-300 active:scale-[0.98]"
      style={tabStaggerStyle(entered, index, 60)}
    >
      <MarketFlag countryCode={market.countryCode} size={40} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold tracking-tight text-pocket-text">
          {market.name}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-pocket-muted">
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

export function DiscoverPage({
  articles,
  onOpenCompany,
  onOpenMarketFeed,
}: DiscoverPageProps) {
  const tabEntered = useTabPageEntered("discover");
  const {
    followedMarkets,
    sectorInterests,
    savedArticles,
    companyPanelTicker,
  } = useApp();
  const [favouriteTopics, setFavouriteTopics] = useState(() =>
    loadFavouriteTopics()
  );
  const [personalizationTick, setPersonalizationTick] = useState(0);
  const [assetTab, setAssetTab] = useState<BrowseAssetTab>("companies");
  const [displayedAssetTab, setDisplayedAssetTab] =
    useState<BrowseAssetTab>("companies");
  const [gridVisible, setGridVisible] = useState(true);
  const {
    panelItem: panelMarket,
    panelVisible,
    listVisible,
    openPanel: openMarket,
    closePanel,
  } = usePanelTransition<MarketFilter>();
  const companies = useMemo(() => getExploreCompanies(), []);
  const cryptoAssets = useMemo(() => getCryptoAssets(), []);
  const markets = useMemo(() => {
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

  useEffect(() => {
    prefetchCompanyLogos(companies.map((company) => company.ticker));
  }, [companies]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => {
      setFavouriteTopics(loadFavouriteTopics());
      setPersonalizationTick((t) => t + 1);
    };
    window.addEventListener("pf-progression-updated", refresh);
    window.addEventListener(PF_TOPICS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener("pf-progression-updated", refresh);
      window.removeEventListener(PF_TOPICS_CHANGED_EVENT, refresh);
    };
  }, []);

  const articlesById = useMemo(
    () => new Map(articles.map((article) => [article.id, article])),
    [articles]
  );

  const personalizationInput = useMemo(() => {
    void personalizationTick;
    return buildFeedPersonalizationInput({
      followedMarkets,
      sectorInterests,
      favouriteTopics,
      savedArticles,
      articlesById,
    });
  }, [
    followedMarkets,
    sectorInterests,
    favouriteTopics,
    savedArticles,
    articlesById,
    personalizationTick,
  ]);

  const rankedCompanies = useMemo(
    () => rankExploreCompanies(companies, personalizationInput),
    [companies, personalizationInput]
  );

  const rankedCrypto = useMemo(
    () => rankExploreCompanies(cryptoAssets, personalizationInput),
    [cryptoAssets, personalizationInput]
  );

  const activeCatalog =
    displayedAssetTab === "crypto" ? rankedCrypto : rankedCompanies;

  const displayCompanies = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return activeCatalog;
    return filterExploreCompanies(activeCatalog, q);
  }, [activeCatalog, searchQuery]);

  const displayMarkets = useMemo(
    () => filterMarkets(markets, searchQuery),
    [markets, searchQuery]
  );

  useEffect(() => {
    if (assetTab === displayedAssetTab) {
      setGridVisible(true);
      return;
    }

    setGridVisible(false);
    let fadeInTimer: number | undefined;
    const fadeOutTimer = window.setTimeout(() => {
      setDisplayedAssetTab(assetTab);
      fadeInTimer = window.setTimeout(() => setGridVisible(true), 20);
    }, 120);

    return () => {
      window.clearTimeout(fadeOutTimer);
      if (fadeInTimer !== undefined) window.clearTimeout(fadeInTimer);
    };
  }, [assetTab, displayedAssetTab]);

  const searchActive = Boolean(searchQuery.trim());
  const showingMarkets = displayedAssetTab === "markets";

  if (panelMarket) {
    return (
      <div className="pf-page h-full bg-pocket-bg" style={panelEnterStyle(panelVisible)}>
        <MarketPanel
          marketId={panelMarket}
          onBack={closePanel}
          onOpenFeed={onOpenMarketFeed}
          onOpenCompany={onOpenCompany}
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
          Browse
        </h1>
        <p
          className="mt-0.5 text-[13px] text-pocket-muted"
          style={tabEnterFadeStyle(tabEntered, 40)}
        >
          Explore companies, markets, and crypto
        </p>

        <div className="mt-5" style={tabEnterStyle(tabEntered, 60)}>
          <BrowseAssetTabs active={assetTab} onChange={setAssetTab} />
        </div>

        <div className="relative mt-4" style={tabEnterStyle(tabEntered, 80)}>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pocket-muted" />
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={
              displayedAssetTab === "crypto"
                ? "Search crypto symbol…"
                : displayedAssetTab === "markets"
                  ? "Search market or exchange…"
                  : "Search ticker or company…"
            }
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]"
        style={listLayerStyle(!companyPanelTicker && listVisible)}
      >
        {searchActive &&
        (showingMarkets ? displayMarkets.length === 0 : displayCompanies.length === 0) ? (
          <p
            className="px-1 pt-8 text-center text-[14px] text-pocket-muted"
            style={tabEnterFadeStyle(tabEntered, 120)}
          >
            No{" "}
            {displayedAssetTab === "crypto"
              ? "crypto assets"
              : displayedAssetTab === "markets"
                ? "markets"
                : "companies"}{" "}
            match &ldquo;{searchQuery.trim()}&rdquo;
          </p>
        ) : (
          <div
            key={displayedAssetTab}
            className={`pt-1 transition-opacity duration-150 ease-out ${
              showingMarkets
                ? "flex flex-col gap-2.5"
                : "grid grid-cols-2 gap-3"
            }`}
            style={{
              opacity: gridVisible ? 1 : 0,
              transform: gridVisible ? "translateY(0)" : "translateY(3px)",
              transitionProperty: "opacity, transform",
              transitionDuration: "150ms",
              transitionTimingFunction: gridVisible
                ? TAB_ENTER_EASE
                : TAB_EXIT_EASE,
            }}
          >
            {showingMarkets
              ? displayMarkets.map((market, index) => (
                  <MarketBrowseCard
                    key={market.id}
                    market={market}
                    index={index}
                    entered={tabEntered}
                    onOpen={() => openMarket(market.id)}
                  />
                ))
              : displayCompanies.map((company, index) => (
                  <CompanyCard
                    key={company.ticker}
                    company={company}
                    index={index}
                    entered={tabEntered}
                    onOpen={() => onOpenCompany(company.ticker)}
                  />
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
