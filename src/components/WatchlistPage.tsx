"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  ChevronRight,
  Landmark,
  Newspaper,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  listLayerStyle,
  panelEnterStyle,
  tabEnterFadeStyle,
  tabEnterStyle,
  tabStaggerStyle,
  usePanelTransition,
  useTabPageEntered,
} from "@/lib/tabEnterAnimation";
import { getStockProfile } from "@/lib/stockData";
import { getTickerMetaBySymbol, resolveSavedTicker } from "@/lib/tickerMap";
import type { NewsArticle, SavedArticleEntry } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { shouldShowWatchlistPrice } from "@/lib/usStockTickers";
import {
  articleFromSavedEntry,
  buildWatchlistItems,
  resolveSavedArticle,
  type WatchlistItem,
} from "@/lib/watchlistUtils";
import {
  dismissWatchlistTicker,
  getDismissedWatchlistTickers,
} from "@/lib/watchlistStore";
import { isMarketThemeTicker } from "@/lib/marketThemes";
import { recordActivityEvent } from "@/lib/progression";
import { CompanyLogo } from "./CompanyLogo";
import { ArticlePanel } from "./ArticlePanel";
import { tickerLogoColor } from "./ProfileArticlePreview";
import { StockPanel } from "./StockPanel";

const CARD_CLASS = "pf-card-surface overflow-hidden rounded-2xl";

type WatchlistPanel =
  | { kind: "article"; article: NewsArticle }
  | { kind: "theme"; item: WatchlistItem };

type LucideIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const THEME_META: Record<string, { title: string; Icon: LucideIcon }> = {
  FED: { title: "Federal Reserve", Icon: Landmark },
  RATES: { title: "Interest Rates", Icon: TrendingUp },
  MARKET: { title: "Broad Market", Icon: TrendingUp },
  SPX: { title: "S&P 500", Icon: TrendingUp },
  QQQ: { title: "Nasdaq 100", Icon: TrendingUp },
  DJI: { title: "Dow Jones", Icon: TrendingUp },
  OIL: { title: "Oil & Energy", Icon: Zap },
  ENERGY: { title: "Oil & Energy", Icon: Zap },
  CRYPTO: { title: "Crypto Markets", Icon: TrendingUp },
  GOLD: { title: "Gold", Icon: TrendingUp },
};

function getThemeMeta(ticker: string): { title: string; Icon: LucideIcon } {
  return THEME_META[ticker.toUpperCase()] ?? { title: ticker, Icon: TrendingUp };
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
      {children}
    </p>
  );
}

function SummaryCard({
  assetCount,
  themeCount,
  articleCount,
  bestTicker,
  bestPct,
  worstTicker,
  worstPct,
}: {
  assetCount: number;
  themeCount: number;
  articleCount: number;
  bestTicker: string | null;
  bestPct: number | null;
  worstTicker: string | null;
  worstPct: number | null;
}) {
  const showMovers = bestTicker !== null || worstTicker !== null;
  const showBoth =
    bestTicker !== null && worstTicker !== null && bestTicker !== worstTicker;

  return (
    <div className="pf-card-surface mx-5 mt-4 rounded-2xl p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-pocket-muted">
        Your watchlist
      </p>
      <p className="mt-1 text-[22px] font-bold tracking-tight text-pocket-text">
        {articleCount} saved article{articleCount !== 1 ? "s" : ""}
      </p>
      <p className="mt-1 text-[13px] text-pocket-muted">
        {assetCount > 0 && themeCount > 0
          ? `${assetCount} asset${assetCount !== 1 ? "s" : ""} · ${themeCount} theme${themeCount !== 1 ? "s" : ""}`
          : assetCount > 0
            ? `${assetCount} tracked asset${assetCount !== 1 ? "s" : ""}`
            : themeCount > 0
              ? `${themeCount} market theme${themeCount !== 1 ? "s" : ""}`
              : "Track companies and themes from articles you save"}
      </p>

      {showMovers && (
        <div className="mt-3.5 space-y-1.5">
          {bestTicker !== null &&
            bestPct !== null &&
            (showBoth || worstTicker === null) && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-pocket-muted">Best mover</span>
                <span className="text-[12px] font-semibold tabular-nums text-emerald-400">
                  {bestTicker}&nbsp;+{bestPct.toFixed(2)}%
                </span>
              </div>
            )}
          {worstTicker !== null &&
            worstPct !== null &&
            (showBoth || bestTicker === null) && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-pocket-muted">Worst mover</span>
                <span className="text-[12px] font-semibold tabular-nums text-red-400">
                  {worstTicker}&nbsp;{worstPct.toFixed(2)}%
                </span>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function RowRemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-pocket-muted active:bg-red-500/15 active:text-red-400"
      aria-label={label}
    >
      <X className="h-4 w-4" strokeWidth={2.25} />
    </button>
  );
}

function AssetRow({
  item,
  onTap,
  onRemove,
}: {
  item: WatchlistItem;
  onTap: () => void;
  onRemove: () => void;
}) {
  const meta = getTickerMetaBySymbol(item.ticker);
  const showPrice = shouldShowWatchlistPrice(item.ticker);
  const stock = showPrice ? getStockProfile(item.ticker) : null;
  const up = stock ? stock.changePercent >= 0 : false;

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 active:bg-white/[0.03]"
      style={{ minHeight: 72 }}
    >
      <button
        type="button"
        data-no-drag
        onClick={onTap}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="shrink-0 overflow-hidden rounded-xl">
          <CompanyLogo
            ticker={item.ticker}
            color={meta.logoColor}
            size={44}
            shape="square"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold tracking-tight text-pocket-text">
            {item.ticker}
          </p>
          <p className="truncate text-[12px] text-pocket-muted">
            {meta.companyName}
          </p>
          <p className="mt-0.5 text-[11px] text-pocket-muted">
            {item.allEntries.length} saved article
            {item.allEntries.length !== 1 ? "s" : ""}
          </p>
        </div>

        {stock && showPrice && (
          <div className="shrink-0 text-right">
            <p className="text-[14px] font-semibold tabular-nums text-pocket-text">
              ${stock.price.toFixed(2)}
            </p>
            <p
              className={`text-[12px] font-medium tabular-nums ${
                up ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {up ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
            </p>
          </div>
        )}

        <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" strokeWidth={2} />
      </button>
      <RowRemoveButton label={`Remove ${item.ticker}`} onClick={onRemove} />
    </div>
  );
}

function ThemeRow({
  item,
  onTap,
  onRemove,
}: {
  item: WatchlistItem;
  onTap: () => void;
  onRemove: () => void;
}) {
  const { title, Icon } = getThemeMeta(item.ticker);

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 active:bg-white/[0.03]"
      style={{ minHeight: 72 }}
    >
      <button
        type="button"
        data-no-drag
        onClick={onTap}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--pocket-surface-hover)]"
        >
          <Icon className="h-5 w-5 text-pocket-muted" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold tracking-tight text-pocket-text">
            {title}
          </p>
          <p className="line-clamp-1 text-[12px] leading-snug text-pocket-muted">
            {item.latestEntry.articleTitle}
          </p>
          <p className="mt-0.5 text-[11px] text-pocket-muted">
            {item.allEntries.length} saved · updated {timeAgo(item.latestEntry.savedAt)}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" strokeWidth={2} />
      </button>
      <RowRemoveButton label={`Remove ${title}`} onClick={onRemove} />
    </div>
  );
}

function SavedArticleRow({
  entry,
  onOpen,
  onRemove,
}: {
  entry: SavedArticleEntry;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const ticker = resolveSavedTicker(entry);
  const meta = getTickerMetaBySymbol(ticker);
  const showCompanyLogo = !isMarketThemeTicker(ticker);

  return (
    <div className="flex items-center gap-2 px-4 py-3 active:bg-white/[0.03]">
      <button
        type="button"
        data-no-drag
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {showCompanyLogo ? (
          <div className="shrink-0 overflow-hidden rounded-xl">
            <CompanyLogo
              ticker={ticker}
              color={meta.logoColor || tickerLogoColor(ticker)}
              size={44}
              shape="square"
            />
          </div>
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--pocket-border)]"
            style={{ background: "var(--pocket-surface-hover)" }}
          >
            <Newspaper className="h-5 w-5 text-pocket-muted" strokeWidth={1.75} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-pocket-text">
            {entry.articleTitle}
          </p>
          <p className="mt-0.5 text-[11px] text-pocket-muted">
            {ticker} · saved {timeAgo(entry.savedAt)}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" strokeWidth={2} />
      </button>
      <RowRemoveButton
        label={`Remove ${entry.articleTitle}`}
        onClick={onRemove}
      />
    </div>
  );
}

function EmptySavedState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--pocket-border)]"
        style={{ background: "var(--pocket-surface-hover)" }}
      >
        <Bookmark className="h-7 w-7 text-pocket-muted" strokeWidth={1.5} />
      </div>
      <p className="text-[15px] font-semibold text-pocket-text">No saved articles yet</p>
      <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-pocket-muted">
        Save articles from your feed or stock panels — they&apos;ll show up here
      </p>
    </div>
  );
}

export function WatchlistPage({
  embedded = false,
  articles = [],
}: {
  embedded?: boolean;
  articles?: NewsArticle[];
}) {
  const {
    savedArticles,
    unsaveArticle,
    requestCompanyPanel,
    ensureWatchlistLoaded,
  } = useApp();
  const tabEntered = useTabPageEntered("watchlist");
  const {
    panelItem,
    panelVisible,
    listVisible,
    openPanel,
    closePanel,
  } = usePanelTransition<WatchlistPanel>();
  const [dismissedTick, setDismissedTick] = useState(0);

  const articlesById = useMemo(
    () => new Map(articles.map((article) => [article.id, article])),
    [articles]
  );

  useEffect(() => {
    ensureWatchlistLoaded();
  }, [ensureWatchlistLoaded]);

  const sortedArticles = useMemo(
    () =>
      [...savedArticles].sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      ),
    [savedArticles]
  );

  const watchlistItems = useMemo(() => {
    const dismissed = getDismissedWatchlistTickers();
    return buildWatchlistItems(savedArticles).filter(
      (item) => !dismissed.has(item.ticker)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedArticles, dismissedTick]);

  const assets = useMemo(
    () => watchlistItems.filter((i) => i.type === "asset"),
    [watchlistItems]
  );

  const themes = useMemo(
    () => watchlistItems.filter((i) => i.type === "theme"),
    [watchlistItems]
  );

  const { bestTicker, bestPct, worstTicker, worstPct } = useMemo(() => {
    const movers = assets
      .filter((a) => shouldShowWatchlistPrice(a.ticker))
      .map((a) => ({ ticker: a.ticker, stock: getStockProfile(a.ticker) }))
      .filter((x) => x.stock !== null);

    if (movers.length === 0) {
      return {
        bestTicker: null,
        bestPct: null,
        worstTicker: null,
        worstPct: null,
      };
    }

    const best = movers.reduce((b, c) =>
      (c.stock?.changePercent ?? -Infinity) > (b.stock?.changePercent ?? -Infinity)
        ? c
        : b
    );
    const worst = movers.reduce((w, c) =>
      (c.stock?.changePercent ?? Infinity) < (w.stock?.changePercent ?? Infinity)
        ? c
        : w
    );

    const showWorst =
      worst.ticker !== best.ticker || (worst.stock?.changePercent ?? 0) < 0;

    return {
      bestTicker: best.ticker,
      bestPct: best.stock?.changePercent ?? null,
      worstTicker: showWorst ? worst.ticker : null,
      worstPct: showWorst ? (worst.stock?.changePercent ?? null) : null,
    };
  }, [assets]);

  const removeTrackedItem = useCallback(
    async (item: WatchlistItem) => {
      for (const entry of item.allEntries) {
        await unsaveArticle(entry.articleId);
      }
      dismissWatchlistTicker(item.ticker);
      setDismissedTick((t) => t + 1);
    },
    [unsaveArticle]
  );

  const removeSavedArticle = useCallback(
    async (entry: SavedArticleEntry) => {
      await unsaveArticle(entry.articleId);
    },
    [unsaveArticle]
  );

  const openTrackedAsset = useCallback(
    (ticker: string) => {
      requestCompanyPanel(ticker, "watchlist");
    },
    [requestCompanyPanel]
  );

  if (panelItem?.kind === "article") {
    return (
      <div className="pf-page h-full bg-pocket-bg" style={panelEnterStyle(panelVisible)}>
        <ArticlePanel
          article={panelItem.article}
          onBack={closePanel}
        />
      </div>
    );
  }

  if (panelItem?.kind === "theme") {
    return (
      <div className="pf-page h-full bg-pocket-bg" style={panelEnterStyle(panelVisible)}>
        <StockPanel
          article={articleFromSavedEntry(panelItem.item.latestEntry)}
          onBack={closePanel}
        />
      </div>
    );
  }

  const listEntered = tabEntered && listVisible;

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      {!embedded && (
        <header
          className="shrink-0 px-5 pb-3"
          style={{
            paddingTop: "max(12px, env(safe-area-inset-top))",
            background: "var(--pocket-bg)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            ...tabEnterStyle(tabEntered, 0),
          }}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-[28px] font-bold tracking-tight text-pocket-text">
              Watchlist
            </h1>
          </div>
        </header>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
          ...listLayerStyle(listVisible),
        }}
      >
        {savedArticles.length === 0 ? (
          <div style={tabEnterStyle(listEntered, 120)}>
            <EmptySavedState />
          </div>
        ) : (
          <>
            <div style={tabEnterStyle(listEntered, 120)}>
              <SummaryCard
                assetCount={assets.length}
                themeCount={themes.length}
                articleCount={savedArticles.length}
                bestTicker={bestTicker}
                bestPct={bestPct}
                worstTicker={worstTicker}
                worstPct={worstPct}
              />
            </div>

            {assets.length > 0 && (
              <section style={tabEnterFadeStyle(listEntered, 180)}>
                <SectionHeader>Stocks</SectionHeader>
                <div className={`mx-5 ${CARD_CLASS}`}>
                  <div className="divide-y divide-[var(--pocket-border)]">
                    {assets.map((item, index) => (
                      <div
                        key={item.ticker}
                        style={tabStaggerStyle(listEntered, index, 200)}
                      >
                        <AssetRow
                          item={item}
                          onTap={() => openTrackedAsset(item.ticker)}
                          onRemove={() => void removeTrackedItem(item)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {themes.length > 0 && (
              <section style={tabEnterFadeStyle(listEntered, 260)}>
                <SectionHeader>Market themes</SectionHeader>
                <div className={`mx-5 ${CARD_CLASS}`}>
                  <div className="divide-y divide-[var(--pocket-border)]">
                    {themes.map((item, index) => (
                      <div
                        key={item.ticker}
                        style={tabStaggerStyle(listEntered, index, 280)}
                      >
                        <ThemeRow
                          item={item}
                          onTap={() => openPanel({ kind: "theme", item })}
                          onRemove={() => void removeTrackedItem(item)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section style={tabEnterFadeStyle(listEntered, 340)}>
              <SectionHeader>Saved Articles</SectionHeader>
              <div className={`mx-5 ${CARD_CLASS}`}>
                <div className="divide-y divide-[var(--pocket-border)]">
                  {sortedArticles.map((entry, index) => (
                    <div
                      key={entry.id}
                      style={tabStaggerStyle(listEntered, index, 360)}
                    >
                      <SavedArticleRow
                        entry={entry}
                        onOpen={() => {
                          const article = resolveSavedArticle(entry, articlesById);
                          recordActivityEvent("article_opened", entry.articleId, {
                            articleId: entry.articleId,
                            category: resolveSavedTicker(entry),
                          });
                          openPanel({ kind: "article", article });
                        }}
                        onRemove={() => void removeSavedArticle(entry)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}


      </div>
    </div>
  );
}
