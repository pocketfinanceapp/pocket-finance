"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import { SECTOR_FILTERS, type SectorFilter } from "@/lib/filters";
import { getCoveredCountryItems } from "@/lib/coveredCountries";
import type {
  MarketauxTrendingCountry,
  MarketauxTrendingEntity,
} from "@/lib/marketauxApi";
import { countryName } from "@/lib/countryNames";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import {
  DEFAULT_TRENDING_TICKER_LIMIT,
  rankTickersByMentions,
  type TrendingTicker,
} from "@/lib/trendingTickers";
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

export function ExplorePage({ catalogArticles, onSidePanelChange }: ExplorePageProps) {
  const {
    clearFilters,
    toggleSectorFilter,
    setSearchQuery,
    setCountryFilter,
  } = useApp();
  const { navigate } = useNavigation();
  const entered = useTabPageEntered("explore");

  const [liveTrending, setLiveTrending] = useState<MarketauxTrendingEntity[] | null>(
    null
  );
  const [liveCountries, setLiveCountries] = useState<
    MarketauxTrendingCountry[] | null
  >(null);
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
    let cancelled = false;
    fetch("/api/marketaux/trending-countries?limit=20")
      .then((res) => (res.ok ? res.json() : { countries: [] }))
      .then((data: { countries?: MarketauxTrendingCountry[] }) => {
        if (!cancelled) setLiveCountries(data.countries ?? []);
      })
      .catch(() => {
        if (!cancelled) setLiveCountries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onSidePanelChange?.(selectedTicker !== null);
  }, [selectedTicker, onSidePanelChange]);

  const localTrending = useMemo(
    () => rankTickersByMentions(catalogArticles, DEFAULT_TRENDING_TICKER_LIMIT),
    [catalogArticles]
  );

  /** Story counts per topic from the cached feed pool — same source the
   * local trending-ticker fallback uses. There's no live Marketaux
   * endpoint for "stories by sector today" (sector is our own local
   * categorization, not a Marketaux concept), so this reflects the
   * current feed pool rather than a live daily total across all markets. */
  const topicCounts = useMemo(() => {
    const counts = new Map<SectorFilter, number>();
    for (const sector of SECTOR_FILTERS) counts.set(sector, 0);
    for (const article of catalogArticles) {
      const sector = article.sector as SectorFilter;
      if (counts.has(sector)) counts.set(sector, (counts.get(sector) ?? 0) + 1);
    }
    return counts;
  }, [catalogArticles]);

  /** The topics with the most stories right now — a `require ≥3 stories`
   * floor keeps a near-empty category from getting a "Trending" tag just
   * because it happens to edge out other near-empty categories. */
  const trendingTopics = useMemo(() => {
    const ranked = SECTOR_FILTERS.map((sector) => ({
      sector,
      count: topicCounts.get(sector) ?? 0,
    }))
      .filter((entry) => entry.count >= 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);
    return new Set(ranked.map((entry) => entry.sector));
  }, [topicCounts]);

  /**
   * Confirmed-hot tickers from Marketaux's live global-trending endpoint go
   * first (when they actually have a story in our own catalog — otherwise
   * the badge would lead to "no stories" for that ticker), then backfilled
   * with the full local mention-ranking across every Browse-by-topic
   * sector so the strip reflects everything in the catalog — around
   * DEFAULT_TRENDING_TICKER_LIMIT tickers — rather than being capped at whatever
   * sliver happens to overlap the live endpoint.
   */
  const trendingTickers: TrendingTicker[] = useMemo(() => {
    const merged: TrendingTicker[] = [];
    const seen = new Set<string>();

    if (liveTrending && liveTrending.length > 0) {
      const localByTicker = new Map<string, NewsArticle>();
      for (const article of catalogArticles) {
        const key = article.ticker?.trim().toUpperCase();
        if (key && !localByTicker.has(key)) localByTicker.set(key, article);
      }

      for (const e of liveTrending) {
        const symbol = e.symbol.toUpperCase();
        const localArticle = localByTicker.get(symbol);
        if (!localArticle || seen.has(symbol)) continue;
        seen.add(symbol);
        merged.push({
          ticker: symbol,
          // Prefer the name from an actual article in the feed — it's
          // guaranteed accurate, unlike the ticker-map fallback.
          companyName:
            localArticle.companyName || getTickerMetaBySymbol(symbol).companyName,
          count: e.totalDocuments,
          sentimentAvg: e.sentimentAvg,
          articles: [localArticle],
        });
      }
    }

    for (const t of localTrending) {
      if (merged.length >= DEFAULT_TRENDING_TICKER_LIMIT) break;
      if (seen.has(t.ticker)) continue;
      seen.add(t.ticker);
      merged.push(t);
    }

    return merged;
  }, [liveTrending, localTrending, catalogArticles]);

  const openSector = (sector: SectorFilter) => {
    clearFilters();
    toggleSectorFilter(sector);
    navigate("home");
  };

  const openCountry = (countryCode: string) => {
    clearFilters();
    setCountryFilter(countryCode);
    navigate("home");
  };

  /** Real country coverage from Marketaux when available; falls back to a
   * curated list of countries confirmed in Marketaux's actual supported-
   * country set only if the live endpoint is unavailable. */
  const regionItems = useMemo(() => {
    if (liveCountries && liveCountries.length > 0) {
      return liveCountries.map((c) => ({
        key: c.countryCode,
        countryCode: c.countryCode,
        title: countryName(c.countryCode),
        subtitle: `${c.totalDocuments} ${c.totalDocuments === 1 ? "story" : "stories"} today`,
        sentimentAvg: c.sentimentAvg,
        onSelect: () => openCountry(c.countryCode),
      }));
    }
    return getCoveredCountryItems().map((item) => ({
      key: item.countryCode,
      countryCode: item.countryCode,
      title: item.title,
      subtitle: item.subtitle,
      sentimentAvg: null as number | null,
      onSelect: () => openCountry(item.countryCode),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveCountries]);

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
            Powered by{" "}
            <span className="font-semibold text-pocket-text">5,000+</span>{" "}
            news sources across{" "}
            <span className="font-semibold text-pocket-text">80+</span>{" "}
            global markets
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
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
                Browse by topic
              </h2>
              {trendingTopics.size > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#00C6C6]/35 bg-[#00C6C6]/14 px-2 py-0.5 text-[10px] font-semibold text-[#00C6C6]">
                  <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                  Trending: {SECTOR_FILTERS.filter((s) => trendingTopics.has(s)).join(", ")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SECTOR_FILTERS.map((sector) => {
                const count = topicCounts.get(sector) ?? 0;
                return (
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
                    <p className="mt-0.5 text-[11px] text-pocket-muted">
                      {count} {count === 1 ? "story" : "stories"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <h2 className="mb-1 text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
              Browse by region
            </h2>
            <p className="mb-2 text-[11px] text-pocket-muted">
              Countries with fresh stories today — coverage spans 80+ markets overall.
            </p>
            <ul className="divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
              {regionItems.map((item) => {
                const dotColor =
                  item.sentimentAvg === null
                    ? null
                    : sentimentLabel(item.sentimentAvg) === "bullish"
                      ? "#00C6C6"
                      : sentimentLabel(item.sentimentAvg) === "bearish"
                        ? "#f87171"
                        : "var(--pocket-muted)";
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      data-no-drag
                      onClick={item.onSelect}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[var(--pocket-surface-hover)]"
                    >
                      <MarketFlag countryCode={item.countryCode} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-pocket-text">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-pocket-muted">
                          {item.subtitle}
                        </p>
                      </div>
                      {dotColor && (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: dotColor }}
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
