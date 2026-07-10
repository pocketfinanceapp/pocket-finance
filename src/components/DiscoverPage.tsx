"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  filterExploreCompanies,
  getExploreCompanies,
  type ExploreCompany,
} from "@/lib/exploreCompanies";
import {
  buildFeedPersonalizationInput,
  rankExploreCompanies,
} from "@/lib/feedPersonalization";
import { prefetchCompanyLogos } from "@/lib/logoCache";
import { getStockProfile } from "@/lib/stockData";
import { fetchStockQuote } from "@/lib/stockQuoteClient";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import type { NewsArticle } from "@/lib/types";
import {
  loadFavouriteTopics,
  PF_TOPICS_CHANGED_EVENT,
} from "@/lib/profileStorage";
import {
  panelEnterStyle,
  tabEnterFadeStyle,
  tabEnterStyle,
  tabStaggerStyle,
  TAB_ENTER_EASE,
  useTabPageEntered,
} from "@/lib/tabEnterAnimation";
import { CompanyLogo } from "./CompanyLogo";
import { StockPanel } from "./StockPanel";

interface DiscoverPageProps {
  articles: NewsArticle[];
}

function articleFromTicker(ticker: string): NewsArticle {
  const meta = getTickerMetaBySymbol(ticker);
  const now = new Date().toISOString();
  return {
    id: `explore-${ticker}`,
    headline: meta.companyName,
    subheading: "",
    body: "",
    imageUrl: "",
    market: meta.market,
    sector: meta.sector,
    ticker,
    companyName: meta.companyName,
    tags: meta.tags,
    publishedAt: now,
    sourceName: "",
    sourceId: null,
    sourceUrl: "",
    likes: 0,
    comments: 0,
    shares: 0,
  };
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

export function DiscoverPage({ articles }: DiscoverPageProps) {
  const tabEntered = useTabPageEntered("discover");
  const { followedMarkets, sectorInterests, savedArticles } = useApp();
  const [favouriteTopics, setFavouriteTopics] = useState(() =>
    loadFavouriteTopics()
  );
  const [personalizationTick, setPersonalizationTick] = useState(0);
  const companies = useMemo(() => getExploreCompanies(), []);

  useEffect(() => {
    prefetchCompanyLogos(companies.map((company) => company.ticker));
  }, [companies]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [panelTicker, setPanelTicker] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [listVisible, setListVisible] = useState(true);
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

  const displayCompanies = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return rankedCompanies;
    return filterExploreCompanies(rankedCompanies, q);
  }, [rankedCompanies, searchQuery]);

  const openCompany = useCallback((ticker: string) => {
    setListVisible(false);
    window.setTimeout(() => {
      setPanelTicker(ticker);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPanelVisible(true));
      });
    }, 220);
  }, []);

  const closePanel = useCallback(() => {
    setPanelVisible(false);
    window.setTimeout(() => {
      setPanelTicker(null);
      window.requestAnimationFrame(() => setListVisible(true));
    }, 380);
  }, []);

  if (panelTicker) {
    return (
      <div className="pf-page h-full bg-pocket-bg" style={panelEnterStyle(panelVisible)}>
        <StockPanel article={articleFromTicker(panelTicker)} onBack={closePanel} />
      </div>
    );
  }

  const searchActive = Boolean(searchQuery.trim());

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
          Companies
        </h1>
        <p
          className="mt-0.5 text-[13px] text-pocket-muted"
          style={tabEnterFadeStyle(tabEntered, 40)}
        >
          Browse listed companies ranked for you
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
            placeholder="Search ticker or company…"
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
        {searchActive && displayCompanies.length === 0 ? (
          <p
            className="px-1 pt-8 text-center text-[14px] text-pocket-muted"
            style={tabEnterFadeStyle(tabEntered, 120)}
          >
            No companies match &ldquo;{searchQuery.trim()}&rdquo;
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {displayCompanies.map((company, index) => (
              <CompanyCard
                key={company.ticker}
                company={company}
                index={index}
                entered={tabEntered && listVisible}
                onOpen={() => openCompany(company.ticker)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
