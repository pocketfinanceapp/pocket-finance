"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import { SECTOR_FILTERS, type MarketFilter, type SectorFilter } from "@/lib/filters";
import { GLOBAL_MARKETS } from "@/lib/markets";
import type { MarketauxTrendingEntity } from "@/lib/marketauxApi";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import type { NewsArticle } from "@/lib/types";
import { CompanyLogo } from "./CompanyLogo";
import { MarketFlag } from "./MarketFlag";
import { sentimentLabel } from "./SentimentBadge";
import { TickerDetailPanel } from "./TickerDetailPanel";

interface ExplorePageProps {
  catalogArticles: NewsArticle[];
  /** Called when the ticker detail overlay opens/closes (hides bottom nav) */
  onSidePanelChange?: (open: boolean) => void;
}

interface TrendingTicker {
  ticker: string;
  companyName: string;
  count: number;
  sentimentAvg: number | null;
}

/** Local fallback: ranks tickers by mentions in the cached article pool —
 * used only when the live Marketaux trending endpoint is unavailable. */
function rankTickersByMentions(articles: NewsArticle[]): TrendingTicker[] {
  const counts = new Map<string, TrendingTicker>();

  for (const article of articles) {
    const ticker = article.ticker?.trim().toUpperCase();
    if (!ticker) continue;
    const existing = counts.get(ticker);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(ticker, {
        ticker,
        companyName: article.companyName || ticker,
        count: 1,
        sentimentAvg: null,
      });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export function ExplorePage({ catalogArticles, onSidePanelChange }: ExplorePageProps) {
  const { clearFilters, setMarketFilters, toggleSectorFilter, setSearchQuery } =
    useApp();
  const { navigate } = useNavigation();
  const entered = useTabPageEntered("explore");

  const [liveTrending, setLiveTrending] = useState<MarketauxTrendingEntity[] | null>(
    null
  );
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/marketaux/trending?limit=12")
      .then((res) => (res.ok ? res.json() : { entities: [] }))
      .then((data: { entities?: MarketauxTrendingEntity[] }) => {
        if (!cancelled) setLiveTrending(data.entities ?? []);
      })
      .catch(() => {
        if (!cancelled) setLiveTrending([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onSidePanelChange?.(selectedTicker !== null);
  }, [selectedTicker, onSidePanelChange]);

  const localTrending = useMemo(
    () => rankTickersByMentions(catalogArticles),
    [catalogArticles]
  );

  const trendingTickers: TrendingTicker[] = useMemo(() => {
    if (liveTrending && liveTrending.length > 0) {
      return liveTrending.map((e) => ({
        ticker: e.symbol,
        companyName: getTickerMetaBySymbol(e.symbol).companyName,
        count: e.totalDocuments,
        sentimentAvg: e.sentimentAvg,
      }));
    }
    return localTrending;
  }, [liveTrending, localTrending]);

  const openSector = (sector: SectorFilter) => {
    clearFilters();
    toggleSectorFilter(sector);
    navigate("home");
  };

  const openMarket = (market: MarketFilter) => {
    clearFilters();
    setMarketFilters([market]);
    navigate("home");
  };

  if (selectedTicker) {
    return (
      <TickerDetailPanel
        ticker={selectedTicker}
        catalogArticles={catalogArticles}
        onClose={() => setSelectedTicker(null)}
      />
    );
  }

  return (
    <div className="pf-page relative flex h-full flex-col bg-pocket-bg text-pocket-text">
      <header
        className="flex shrink-0 flex-col border-b border-[var(--pocket-border)] px-5"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="pb-3 pt-1.5">
          <h1 className="text-[1.625rem] font-bold tracking-tight">Explore</h1>
          <p className="mt-0.5 text-[12px] text-pocket-muted">
            Powered by 5,000+ news sources across 80+ global markets
          </p>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 pt-5"
        style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <div style={tabEnterStyle(entered)}>
          {trendingTickers.length > 0 && (
            <section>
              <h2 className="mb-2 text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
                Trending tickers
              </h2>
              <div className="-mx-5 overflow-x-auto px-5">
                <div className="flex w-max gap-3 pb-1">
                  {trendingTickers.map((item) => {
                    const dotColor =
                      item.sentimentAvg === null
                        ? null
                        : sentimentLabel(item.sentimentAvg) === "bullish"
                          ? "#00C6C6"
                          : sentimentLabel(item.sentimentAvg) === "bearish"
                            ? "#f87171"
                            : "var(--pocket-muted)";
                    return (
                      <button
                        key={item.ticker}
                        type="button"
                        data-no-drag
                        onClick={() => setSelectedTicker(item.ticker)}
                        className="flex w-[92px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-2 py-3 text-center active:opacity-70"
                      >
                        <div className="relative">
                          <CompanyLogo
                            ticker={item.ticker}
                            color={getTickerMetaBySymbol(item.ticker).logoColor}
                            size={40}
                            shape="circle"
                          />
                          {dotColor && (
                            <span
                              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--pocket-card)]"
                              style={{ backgroundColor: dotColor }}
                              aria-hidden
                            />
                          )}
                        </div>
                        <span className="text-[12px] font-bold text-pocket-text">
                          {item.ticker}
                        </span>
                        <span className="text-[10px] text-pocket-muted">
                          {item.count} {item.count === 1 ? "story" : "stories"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="mt-7">
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
              Browse by topic
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {SECTOR_FILTERS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  data-no-drag
                  onClick={() => openSector(sector)}
                  className="rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-4 py-4 text-left active:opacity-70"
                >
                  <span className="text-[14px] font-bold text-pocket-text">
                    {sector}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <h2 className="mb-2 text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
              Browse by region
            </h2>
            <ul className="divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
              {GLOBAL_MARKETS.map((market) => (
                <li key={market.id}>
                  <button
                    type="button"
                    data-no-drag
                    onClick={() => openMarket(market.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[var(--pocket-surface-hover)]"
                  >
                    <MarketFlag countryCode={market.countryCode} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-pocket-text">
                        {market.fullName}
                      </p>
                      <p className="text-[11px] text-pocket-muted">
                        {market.country}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
