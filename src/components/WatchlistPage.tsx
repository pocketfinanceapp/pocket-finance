"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  ChevronRight,
  Landmark,
  Newspaper,
  Pencil,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getMarketById } from "@/lib/markets";
import type { MarketFilter } from "@/lib/filters";
import {
  loadFavouriteTopics,
  PF_TOPICS_CHANGED_EVENT,
  type ProfileTopic,
} from "@/lib/profileStorage";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";
import { getStockProfile } from "@/lib/stockData";
import { getTickerMetaBySymbol, resolveSavedTicker } from "@/lib/tickerMap";
import type { NewsArticle, SavedArticleEntry } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { shouldShowWatchlistPrice } from "@/lib/usStockTickers";
import {
  buildWatchlistItems,
  type WatchlistItem,
} from "@/lib/watchlistUtils";
import {
  dismissWatchlistTicker,
  getDismissedWatchlistTickers,
} from "@/lib/watchlistStore";
import { isMarketThemeTicker } from "@/lib/marketThemes";
import { recordActivityEvent } from "@/lib/progression";
import { CompanyLogo } from "./CompanyLogo";
import { tickerLogoColor } from "./ProfileArticlePreview";
import { StockPanel } from "./StockPanel";

const CARD_CLASS = "pf-card-surface overflow-hidden rounded-2xl";

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

function articleFromEntry(entry: SavedArticleEntry, ticker: string): NewsArticle {
  const meta = getTickerMetaBySymbol(ticker);
  return {
    id: entry.articleId,
    headline: entry.articleTitle,
    subheading: "",
    body: "",
    imageUrl: "",
    market: meta.market,
    sector: meta.sector,
    ticker,
    companyName: meta.companyName,
    tags: [ticker],
    publishedAt: entry.savedAt,
    sourceName: "",
    sourceId: null,
    sourceUrl: entry.articleUrl,
    likes: 0,
    comments: 0,
    shares: 0,
  };
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

function InterestPills({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-pocket-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] px-3 py-1 text-[12px] font-medium text-pocket-text"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function InterestsSummary({
  followedMarkets,
  sectorInterests,
  favouriteTopics,
}: {
  followedMarkets: string[];
  sectorInterests: string[];
  favouriteTopics: ProfileTopic[];
}) {
  const hasAny =
    followedMarkets.length > 0 ||
    sectorInterests.length > 0 ||
    favouriteTopics.length > 0;

  const marketLabels = followedMarkets.map(
    (id) => getMarketById(id as MarketFilter)?.name ?? id
  );

  return (
    <section className="pb-2">
      <SectionHeader>Your interests</SectionHeader>
      <div className="mx-5 rounded-2xl pf-card-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#3B6EF5]" strokeWidth={2} />
          <p className="text-[14px] font-semibold text-pocket-text">
            What shapes your feed
          </p>
        </div>

        {!hasAny ? (
          <p className="text-[13px] leading-relaxed text-pocket-muted">
            Follow markets and topics in Profile to personalize your For You feed
            and Companies rankings.
          </p>
        ) : (
          <div className="space-y-4">
            <InterestPills label="Markets" items={marketLabels} />
            <InterestPills label="Sectors" items={sectorInterests} />
            <InterestPills label="Topics" items={favouriteTopics} />
          </div>
        )}
      </div>
    </section>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      data-no-drag
      onClick={onClick}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/90 active:bg-red-400"
      aria-label={label}
    >
      <X className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
    </button>
  );
}

function AssetRow({
  item,
  editMode,
  onTap,
  onRemove,
}: {
  item: WatchlistItem;
  editMode: boolean;
  onTap: () => void;
  onRemove: () => void;
}) {
  const meta = getTickerMetaBySymbol(item.ticker);
  const showPrice = shouldShowWatchlistPrice(item.ticker);
  const stock = showPrice ? getStockProfile(item.ticker) : null;
  const up = stock ? stock.changePercent >= 0 : false;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.03]"
      style={{ minHeight: 72 }}
    >
      {editMode && (
        <RemoveButton label={`Remove ${item.ticker}`} onClick={onRemove} />
      )}

      <button
        type="button"
        data-no-drag
        onClick={editMode ? undefined : onTap}
        className="flex flex-1 items-center gap-3 text-left"
        disabled={editMode}
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

        {!editMode && (
          <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

function ThemeRow({
  item,
  editMode,
  onTap,
  onRemove,
}: {
  item: WatchlistItem;
  editMode: boolean;
  onTap: () => void;
  onRemove: () => void;
}) {
  const { title, Icon } = getThemeMeta(item.ticker);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.03]"
      style={{ minHeight: 72 }}
    >
      {editMode && <RemoveButton label={`Remove ${title}`} onClick={onRemove} />}

      <button
        type="button"
        data-no-drag
        onClick={editMode ? undefined : onTap}
        className="flex flex-1 items-center gap-3 text-left"
        disabled={editMode}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--pocket-border)]"
          style={{ background: "var(--pocket-surface-hover)" }}
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

        {!editMode && (
          <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

function SavedArticleRow({
  entry,
  editMode,
  onOpen,
  onRemove,
}: {
  entry: SavedArticleEntry;
  editMode: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const ticker = resolveSavedTicker(entry);
  const meta = getTickerMetaBySymbol(ticker);
  const showCompanyLogo = !isMarketThemeTicker(ticker);

  return (
    <div className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.03]">
      {editMode && (
        <RemoveButton label={`Remove ${entry.articleTitle}`} onClick={onRemove} />
      )}

      <button
        type="button"
        data-no-drag
        onClick={editMode ? undefined : onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        disabled={editMode}
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

        {!editMode && (
          <ChevronRight className="h-4 w-4 shrink-0 text-pocket-muted" strokeWidth={2} />
        )}
      </button>
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

export function WatchlistPage({ embedded = false }: { embedded?: boolean }) {
  const {
    savedArticles,
    unsaveArticle,
    followedMarkets,
    sectorInterests,
    ensureWatchlistLoaded,
  } = useApp();
  const tabEntered = useTabPageEntered("watchlist");
  const [editMode, setEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState<WatchlistItem | null>(null);
  const [dismissedTick, setDismissedTick] = useState(0);
  const [favouriteTopics, setFavouriteTopics] = useState<ProfileTopic[]>(() =>
    loadFavouriteTopics()
  );

  useEffect(() => {
    ensureWatchlistLoaded();
  }, [ensureWatchlistLoaded]);

  useEffect(() => {
    const refresh = () => setFavouriteTopics(loadFavouriteTopics());
    window.addEventListener(PF_TOPICS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(PF_TOPICS_CHANGED_EVENT, refresh);
  }, []);

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

  const hasEditableContent = savedArticles.length > 0;

  const editToggle = hasEditableContent ? (
    <button
      type="button"
      data-no-drag
      onClick={() => setEditMode((v) => !v)}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
        editMode
          ? "bg-[var(--pocket-surface-hover)] text-pocket-text"
          : "text-pocket-muted active:text-pocket-text"
      }`}
    >
      {editMode ? (
        "Done"
      ) : (
        <>
          <Pencil className="h-3 w-3" strokeWidth={2} />
          Edit
        </>
      )}
    </button>
  ) : null;

  if (activeItem) {
    return (
      <StockPanel
        article={articleFromEntry(activeItem.latestEntry, activeItem.ticker)}
        onBack={() => setActiveItem(null)}
      />
    );
  }

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
            {editToggle}
          </div>
        </header>
      )}

      {embedded && editToggle && (
        <div className="flex shrink-0 justify-end px-5 pb-2">{editToggle}</div>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {savedArticles.length === 0 ? (
          <div style={tabEnterStyle(tabEntered, 120)}>
            <EmptySavedState />
          </div>
        ) : (
          <>
            <div style={tabEnterStyle(tabEntered, 120)}>
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
              <section style={tabEnterStyle(tabEntered, 200)}>
                <SectionHeader>Tracked assets</SectionHeader>
                <div className={`mx-5 ${CARD_CLASS}`}>
                  <div className="divide-y divide-[var(--pocket-border)]">
                    {assets.map((item) => (
                      <AssetRow
                        key={item.ticker}
                        item={item}
                        editMode={editMode}
                        onTap={() => {
                          setEditMode(false);
                          setActiveItem(item);
                        }}
                        onRemove={() => void removeTrackedItem(item)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {themes.length > 0 && (
              <section style={tabEnterStyle(tabEntered, 280)}>
                <SectionHeader>Market themes</SectionHeader>
                <div className={`mx-5 ${CARD_CLASS}`}>
                  <div className="divide-y divide-[var(--pocket-border)]">
                    {themes.map((item) => (
                      <ThemeRow
                        key={item.ticker}
                        item={item}
                        editMode={editMode}
                        onTap={() => {
                          setEditMode(false);
                          setActiveItem(item);
                        }}
                        onRemove={() => void removeTrackedItem(item)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section style={tabEnterStyle(tabEntered, 360)}>
              <SectionHeader>
                Saved articles ({sortedArticles.length})
              </SectionHeader>
              <div className={`mx-5 ${CARD_CLASS}`}>
                <div className="divide-y divide-[var(--pocket-border)]">
                  {sortedArticles.map((entry) => (
                    <SavedArticleRow
                      key={entry.id}
                      entry={entry}
                      editMode={editMode}
                      onOpen={() => {
                        recordActivityEvent("article_opened", entry.articleId, {
                          articleId: entry.articleId,
                          category: resolveSavedTicker(entry),
                        });
                        window.open(
                          entry.articleUrl,
                          "_blank",
                          "noopener,noreferrer"
                        );
                      }}
                      onRemove={() => void removeSavedArticle(entry)}
                    />
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        <div style={tabEnterStyle(tabEntered, 480)}>
          <InterestsSummary
            followedMarkets={followedMarkets}
            sectorInterests={sectorInterests}
            favouriteTopics={favouriteTopics}
          />
        </div>
      </div>
    </div>
  );
}
