"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { NewsArticle } from "@/lib/types";
import { appPath } from "@/lib/appPaths";
import {
  BROWSE_CATEGORIES,
  categoryToSlug,
  filterArticlesByBrowseCategory,
  type BrowseCategory,
} from "@/lib/browseCategories";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import { buildWatchlistItems } from "@/lib/watchlistUtils";
import { getDismissedWatchlistTickers } from "@/lib/watchlistStore";
import { getStockProfile } from "@/lib/stockData";
import { shouldShowWatchlistPrice } from "@/lib/usStockTickers";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";

interface DiscoverPageProps {
  articles: NewsArticle[];
}

export function DiscoverPage({ articles }: DiscoverPageProps) {
  const router = useRouter();
  const tabEntered = useTabPageEntered("discover");
  const { savedArticles } = useApp();

  const watchlistItems = useMemo(() => {
    const dismissed = getDismissedWatchlistTickers();
    return buildWatchlistItems(savedArticles).filter(
      (item) => !dismissed.has(item.ticker)
    );
  }, [savedArticles]);

  const assetItems = useMemo(
    () => watchlistItems.filter((item) => item.type === "asset"),
    [watchlistItems]
  );

  const topAssets = useMemo(() => {
    return assetItems
      .filter((item) => shouldShowWatchlistPrice(item.ticker))
      .map((item) => ({ item, stock: getStockProfile(item.ticker) }))
      .filter((row) => row.stock !== null)
      .sort(
        (a, b) =>
          Math.abs(b.stock.changePercent) - Math.abs(a.stock.changePercent)
      )
      .slice(0, 3);
  }, [assetItems]);

  const topThemes = useMemo(
    () => watchlistItems.filter((item) => item.type === "theme").slice(0, 3),
    [watchlistItems]
  );

  const topicRows = useMemo(() => {
    return BROWSE_CATEGORIES.map((topic) => {
      const topicArticles = filterArticlesByBrowseCategory(articles, topic);
      return {
        topic,
        count: topicArticles.length,
        latest: topicArticles[0] ?? null,
      };
    });
  }, [articles]);

  const openTopic = (topic: BrowseCategory) => {
    router.replace(appPath(`browse/${categoryToSlug(topic)}`), {
      scroll: false,
    });
  };

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      <header
        className="shrink-0 px-5 pb-2"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          ...tabEnterStyle(tabEntered, 0),
        }}
      >
        <h1 className="text-[28px] font-bold tracking-tight text-pocket-text">
          Discover
        </h1>
        <p className="mt-0.5 text-[13px] text-pocket-muted">
          Watchlist momentum and fresh themes, all in one place
        </p>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]"
        style={tabEnterStyle(tabEntered, 80)}
      >
        <section className="pf-card-surface mt-2 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
              Watchlist Pulse
            </p>
            <button
              type="button"
              data-no-drag
              className="text-[12px] font-semibold text-pocket-muted active:text-pocket-text"
              onClick={() => router.replace(appPath("watchlist"), { scroll: false })}
            >
              Full watchlist
            </button>
          </div>

          {watchlistItems.length === 0 ? (
            <p className="mt-3 text-[13px] text-pocket-muted">
              Save stories from Home or Markets to start building your watchlist.
            </p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {topAssets.map(({ item, stock }) => {
                const up = stock.changePercent >= 0;
                return (
                  <button
                    key={item.ticker}
                    type="button"
                    data-no-drag
                    onClick={() =>
                      router.replace(appPath("watchlist"), { scroll: false })
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--pocket-border)] px-3 py-2.5 text-left active:bg-white/[0.03]"
                  >
                    <div>
                      <p className="text-[14px] font-bold text-pocket-text">
                        {item.ticker}
                      </p>
                      <p className="text-[11px] text-pocket-muted">
                        ${stock.price.toFixed(2)}
                      </p>
                    </div>
                    <p
                      className={`text-[13px] font-semibold tabular-nums ${
                        up ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {up ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </p>
                  </button>
                );
              })}

              {topAssets.length === 0 &&
                topThemes.map((item) => (
                  <button
                    key={item.ticker}
                    type="button"
                    data-no-drag
                    onClick={() =>
                      router.replace(appPath("watchlist"), { scroll: false })
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-[var(--pocket-border)] px-3 py-2.5 text-left active:bg-white/[0.03]"
                  >
                    <div>
                      <p className="text-[14px] font-bold text-pocket-text">
                        {item.ticker}
                      </p>
                      <p className="text-[11px] text-pocket-muted">
                        Latest save {timeAgo(item.latestEntry.savedAt)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-pocket-muted" />
                  </button>
                ))}
            </div>
          )}
        </section>

        <section className="pf-card-surface mt-4 rounded-2xl p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
            Explore Topics
          </p>
          <div className="mt-3 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-xl border border-[var(--pocket-border)]">
            {topicRows.map(({ topic, latest, count }) => (
              <button
                key={topic}
                type="button"
                data-no-drag
                onClick={() => openTopic(topic)}
                className="w-full px-3 py-3 text-left active:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-pocket-text">
                      {topic}
                    </p>
                    <p className="mt-0.5 text-[11px] text-pocket-muted">
                      {count} matching stor{count === 1 ? "y" : "ies"}
                    </p>
                    {latest && (
                      <p className="mt-1 line-clamp-1 text-[12px] text-pocket-muted">
                        {cleanArticleTitle(latest.headline)}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {topAssets.length > 0 && (
          <section className="mt-4 grid grid-cols-2 gap-3">
            <MiniStat
              label="Top Riser"
              value={topAssets
                .filter((row) => row.stock.changePercent >= 0)
                .sort((a, b) => b.stock.changePercent - a.stock.changePercent)[0]}
              positive
            />
            <MiniStat
              label="Top Dip"
              value={topAssets
                .filter((row) => row.stock.changePercent < 0)
                .sort((a, b) => a.stock.changePercent - b.stock.changePercent)[0]}
              positive={false}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  positive,
}: {
  label: string;
  value:
    | {
        item: ReturnType<typeof buildWatchlistItems>[number];
        stock: NonNullable<ReturnType<typeof getStockProfile>>;
      }
    | undefined;
  positive: boolean;
}) {
  return (
    <div className="pf-card-surface rounded-2xl p-4">
      <div className="flex items-center gap-1.5">
        {positive ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-pocket-muted">
          {label}
        </p>
      </div>
      {value ? (
        <>
          <p className="mt-2 text-[15px] font-bold text-pocket-text">
            {value.item.ticker}
          </p>
          <p
            className={`text-[13px] font-semibold tabular-nums ${
              value.stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {value.stock.changePercent >= 0 ? "+" : ""}
            {value.stock.changePercent.toFixed(2)}%
          </p>
        </>
      ) : (
        <p className="mt-2 text-[12px] text-pocket-muted">No data yet</p>
      )}
    </div>
  );
}
