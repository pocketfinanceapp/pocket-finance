"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Search, X } from "lucide-react";
import {
  filterExploreCompanies,
  getExploreCompanies,
  type ExploreCompany,
} from "@/lib/exploreCompanies";
import { getChartPointsForPrice, getStockProfile } from "@/lib/stockData";
import { fetchStockQuote } from "@/lib/stockQuoteClient";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import type { NewsArticle } from "@/lib/types";
import {
  tabEnterFadeStyle,
  tabEnterStyle,
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

function useLiveQuote(ticker: string, enabled: boolean) {
  const profile = useMemo(() => getStockProfile(ticker), [ticker]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [liveChange, setLiveChange] = useState<number | null>(null);
  const [liveChangePct, setLiveChangePct] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void fetchStockQuote(ticker).then((quote) => {
      if (cancelled || !quote) return;
      if (typeof quote.price === "number") setLivePrice(quote.price);
      if (typeof quote.change === "number") setLiveChange(quote.change);
      if (typeof quote.changePercent === "number") {
        setLiveChangePct(quote.changePercent);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ticker, enabled]);

  return {
    price: livePrice ?? profile.price,
    change: liveChange ?? profile.change,
    changePercent: liveChangePct ?? profile.changePercent,
    marketCap: profile.marketCap,
    peRatio: profile.peRatio,
    revenue: profile.revenue,
    logoColor: profile.logoColor,
    name: profile.name,
  };
}

function MiniSparkline({
  ticker,
  price,
  positive,
}: {
  ticker: string;
  price: number;
  positive: boolean;
}) {
  const profile = getStockProfile(ticker);
  const points = getChartPointsForPrice(price, ticker, "1D", profile.price);
  if (points.length < 2) return null;

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 280;
  const height = 88;

  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.price - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const stroke = positive ? "#00C6C6" : "#f87171";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[88px] w-full"
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExploreCompanySlide({
  company,
  active,
  entered,
  delayMs,
  onOpen,
}: {
  company: ExploreCompany;
  active: boolean;
  entered: boolean;
  delayMs: number;
  onOpen: () => void;
}) {
  const quote = useLiveQuote(company.ticker, active);
  const positive = quote.changePercent >= 0;

  return (
    <div
      className="flex h-full min-w-full shrink-0 snap-center snap-always flex-col px-5"
      style={tabEnterStyle(entered, delayMs)}
    >
      <div className="pf-card-surface flex min-h-0 flex-1 flex-col rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CompanyLogo
              ticker={company.ticker}
              color={quote.logoColor}
              size={52}
              shape="circle"
            />
            <div>
              <p className="text-[22px] font-bold tracking-tight text-pocket-text">
                {company.ticker}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-pocket-muted">
                {quote.name}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--pocket-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-pocket-muted">
            {company.meta.market}
          </span>
        </div>

        <div className="mt-6">
          <p className="text-[36px] font-bold tracking-tight text-pocket-text">
            ${formatPrice(quote.price)}
          </p>
          <p
            className={`mt-1 text-[15px] font-semibold ${
              positive ? "text-[#00C6C6]" : "text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {quote.change.toFixed(2)} ({positive ? "+" : ""}
            {quote.changePercent.toFixed(2)}%)
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-4">
          <MiniSparkline
            ticker={company.ticker}
            price={quote.price}
            positive={positive}
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Market Cap", value: quote.marketCap || "—" },
            { label: "Revenue", value: quote.revenue || "—" },
            { label: "P/E", value: quote.peRatio || "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[var(--pocket-border)] px-2.5 py-2.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-pocket-muted">
                {stat.label}
              </p>
              <p className="mt-1 text-[13px] font-bold text-pocket-text">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          data-no-drag
          onClick={onOpen}
          className="mt-auto pt-5 text-[13px] font-semibold text-[#00C6C6] active:opacity-70"
        >
          View full profile →
        </button>
      </div>
    </div>
  );
}

function SearchResultRow({
  company,
  entered,
  delayMs,
  onOpen,
}: {
  company: ExploreCompany;
  entered: boolean;
  delayMs: number;
  onOpen: () => void;
}) {
  const quote = useLiveQuote(company.ticker, entered);
  const positive = quote.changePercent >= 0;

  return (
    <button
      type="button"
      data-no-drag
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--pocket-border)] px-3 py-3 text-left active:bg-[var(--pocket-surface-hover)]"
      style={tabEnterStyle(entered, delayMs)}
    >
      <div className="flex min-w-0 items-center gap-3">
        <CompanyLogo
          ticker={company.ticker}
          color={quote.logoColor}
          size={40}
          shape="circle"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-pocket-text">
            {company.ticker}
          </p>
          <p className="line-clamp-1 text-[12px] text-pocket-muted">
            {company.meta.companyName}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <p className="text-[13px] font-semibold text-pocket-text">
            ${formatPrice(quote.price)}
          </p>
          <p
            className={`text-[11px] font-medium ${
              positive ? "text-[#00C6C6]" : "text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {quote.changePercent.toFixed(2)}%
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-pocket-muted" />
      </div>
    </button>
  );
}

export function DiscoverPage({ articles: _articles }: DiscoverPageProps) {
  const tabEntered = useTabPageEntered("discover");
  const companies = useMemo(() => getExploreCompanies(), []);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEntered, setSearchEntered] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [panelTicker, setPanelTicker] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCompanies = useMemo(
    () => filterExploreCompanies(companies, searchQuery),
    [companies, searchQuery]
  );

  const openSearch = useCallback(() => {
    setContentVisible(false);
    window.setTimeout(() => {
      setSearchOpen(true);
      setSearchEntered(false);
      window.setTimeout(() => {
        setSearchEntered(true);
        setContentVisible(true);
        inputRef.current?.focus();
      }, 30);
    }, 180);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchEntered(false);
    setContentVisible(false);
    window.setTimeout(() => {
      setSearchOpen(false);
      setSearchQuery("");
      setContentVisible(true);
    }, 200);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const index = Math.round(el.scrollLeft / width);
    setActiveSlide(index);
  }, []);

  if (panelTicker) {
    return (
      <StockPanel
        article={articleFromTicker(panelTicker)}
        onBack={() => setPanelTicker(null)}
      />
    );
  }

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      <header
        className="shrink-0 px-5 pb-3"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          ...tabEnterStyle(tabEntered, 0),
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {searchOpen ? (
            <button
              type="button"
              data-no-drag
              onClick={closeSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pocket-border)] text-pocket-text active:bg-[var(--pocket-surface-hover)]"
              aria-label="Close search"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-pocket-text">
                Explore
              </h1>
              <p className="mt-0.5 text-[13px] text-pocket-muted">
                Swipe through companies and live market stats
              </p>
            </div>
          )}

          {!searchOpen && (
            <button
              type="button"
              data-no-drag
              onClick={openSearch}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--pocket-border)] text-pocket-text active:bg-[var(--pocket-surface-hover)]"
              aria-label="Search companies"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            searchOpen ? "mt-3 max-h-14 opacity-100" : "max-h-0 opacity-0"
          }`}
          style={tabEnterFadeStyle(searchEntered, 40)}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pocket-muted" />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or company…"
              className="w-full rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] py-2.5 pl-10 pr-10 text-[14px] text-pocket-text outline-none placeholder:text-pocket-muted"
            />
            {searchQuery && (
              <button
                type="button"
                data-no-drag
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-pocket-muted active:text-pocket-text"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        className={`min-h-0 flex-1 transition-opacity duration-300 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
        style={tabEnterStyle(tabEntered, 80)}
      >
        {searchOpen ? (
          <div className="h-full overflow-y-auto overscroll-contain px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
            {searchQuery.trim() === "" ? (
              <p
                className="px-1 pt-2 text-[13px] text-pocket-muted"
                style={tabEnterFadeStyle(searchEntered, 80)}
              >
                Type a ticker or company name — we&apos;ll match close spellings
                too.
              </p>
            ) : filteredCompanies.length === 0 ? (
              <p
                className="px-1 pt-6 text-center text-[14px] text-pocket-muted"
                style={tabEnterFadeStyle(searchEntered, 80)}
              >
                No companies match &ldquo;{searchQuery.trim()}&rdquo;
              </p>
            ) : (
              <div className="space-y-2 pt-2">
                {filteredCompanies.map((company, index) => (
                  <SearchResultRow
                    key={company.ticker}
                    company={company}
                    entered={searchEntered}
                    delayMs={60 + index * 35}
                    onOpen={() => setPanelTicker(company.ticker)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scrollbar-hide"
            >
              {companies.map((company, index) => (
                <ExploreCompanySlide
                  key={company.ticker}
                  company={company}
                  active={Math.abs(index - activeSlide) <= 1}
                  entered={tabEntered}
                  delayMs={100}
                  onOpen={() => setPanelTicker(company.ticker)}
                />
              ))}
            </div>

            <div
              className="flex shrink-0 justify-center gap-1.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3"
              style={tabEnterFadeStyle(tabEntered, 180)}
            >
              {companies.map((company, index) => (
                <span
                  key={company.ticker}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === activeSlide
                      ? "w-5 bg-[#00C6C6]"
                      : "w-1.5 bg-[var(--pocket-border)]"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
