"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ChevronRight,
  Compass,
  Landmark,
  Pencil,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { getStockProfile } from "@/lib/stockData";
import { isMarketThemeTicker } from "@/lib/marketThemes";
import { getTickerMetaBySymbol, resolveSavedTicker } from "@/lib/tickerMap";
import type { NewsArticle, SavedArticleEntry } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { shouldShowWatchlistPrice } from "@/lib/usStockTickers";
import { CompanyLogo } from "./CompanyLogo";
import { ProfileArticlePreview } from "./ProfileArticlePreview";
import { StockPanel } from "./StockPanel";

/* ─── Visual constants ──────────────────────────────────────────────────── */

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(10,11,16,0.97)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

/* ─── Theme metadata ────────────────────────────────────────────────────── */

type LucideIcon = React.ComponentType<{ className?: string; strokeWidth?: number }>;

const THEME_META: Record<string, { title: string; Icon: LucideIcon }> = {
  FED:    { title: "Federal Reserve",  Icon: Landmark    },
  RATES:  { title: "Interest Rates",   Icon: TrendingUp  },
  MARKET: { title: "Broad Market",     Icon: TrendingUp  },
  SPX:    { title: "S&P 500",          Icon: TrendingUp  },
  QQQ:    { title: "Nasdaq 100",       Icon: TrendingUp  },
  DJI:    { title: "Dow Jones",        Icon: TrendingUp  },
  OIL:    { title: "Oil & Energy",     Icon: Zap         },
  ENERGY: { title: "Oil & Energy",     Icon: Zap         },
  CRYPTO: { title: "Crypto Markets",   Icon: TrendingUp  },
  GOLD:   { title: "Gold",             Icon: TrendingUp  },
};

function getThemeMeta(ticker: string): { title: string; Icon: LucideIcon } {
  return THEME_META[ticker.toUpperCase()] ?? { title: ticker, Icon: TrendingUp };
}

/* ─── Data model ────────────────────────────────────────────────────────── */

interface WatchlistItem {
  ticker: string;
  type: "asset" | "theme";
  /** Most recent saved entry for this ticker — used for headline + timestamp */
  latestEntry: SavedArticleEntry;
  /** All saved entries for this ticker — used for bulk remove */
  allEntries: SavedArticleEntry[];
}

function buildWatchlistItems(savedArticles: SavedArticleEntry[]): WatchlistItem[] {
  const byTicker = new Map<string, SavedArticleEntry[]>();

  for (const entry of savedArticles) {
    const ticker = resolveSavedTicker(entry).toUpperCase();
    if (!byTicker.has(ticker)) byTicker.set(ticker, []);
    byTicker.get(ticker)!.push(entry);
  }

  const items: WatchlistItem[] = [];
  for (const [ticker, entries] of byTicker) {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    const type = isMarketThemeTicker(ticker) ? "theme" : "asset";
    items.push({ ticker, type, latestEntry: sorted[0], allEntries: sorted });
  }

  // Sort by most recently added
  return items.sort(
    (a, b) =>
      new Date(b.latestEntry.savedAt).getTime() -
      new Date(a.latestEntry.savedAt).getTime()
  );
}

/** Build a minimal synthetic NewsArticle so StockPanel can render for a given ticker. */
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

/* ─── Section header ────────────────────────────────────────────────────── */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
      {children}
    </p>
  );
}

/* ─── Summary card ──────────────────────────────────────────────────────── */

interface SummaryCardProps {
  assetCount: number;
  themeCount: number;
  bestTicker: string | null;
  bestPct: number | null;
  worstTicker: string | null;
  worstPct: number | null;
}

function SummaryCard({
  assetCount,
  themeCount,
  bestTicker,
  bestPct,
  worstTicker,
  worstPct,
}: SummaryCardProps) {
  const showMovers = bestTicker !== null || worstTicker !== null;
  const showBoth = bestTicker !== null && worstTicker !== null && bestTicker !== worstTicker;

  return (
    <div
      className="mx-5 mt-4 rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(135deg, rgba(10,11,16,0.97) 0%, rgba(0,15,25,0.97) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow:
          "0 0 32px rgba(0,198,198,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        Your Watchlist
      </p>
      <p className="mt-1 text-[22px] font-bold tracking-tight text-white">
        {assetCount > 0 && themeCount > 0
          ? `${assetCount} asset${assetCount !== 1 ? "s" : ""} · ${themeCount} theme${themeCount !== 1 ? "s" : ""}`
          : assetCount > 0
            ? `${assetCount} tracked asset${assetCount !== 1 ? "s" : ""}`
            : `${themeCount} market theme${themeCount !== 1 ? "s" : ""}`}
      </p>

      {showMovers && (
        <div className="mt-3.5 space-y-1.5">
          {bestTicker !== null && bestPct !== null && (showBoth || worstTicker === null) && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-zinc-500">Best</span>
              <span className="text-[12px] font-semibold tabular-nums text-emerald-400">
                {bestTicker}&nbsp;+{bestPct.toFixed(2)}%
              </span>
            </div>
          )}
          {worstTicker !== null && worstPct !== null && (showBoth || bestTicker === null) && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-zinc-500">Worst</span>
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

/* ─── Asset row ─────────────────────────────────────────────────────────── */

interface AssetRowProps {
  item: WatchlistItem;
  editMode: boolean;
  onTap: () => void;
  onRemove: () => void;
}

function AssetRow({ item, editMode, onTap, onRemove }: AssetRowProps) {
  const meta = getTickerMetaBySymbol(item.ticker);
  const showPrice = shouldShowWatchlistPrice(item.ticker);
  const stock = showPrice ? getStockProfile(item.ticker) : null;
  const up = stock ? stock.changePercent >= 0 : false;

  return (
    <div className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.03]" style={{ minHeight: 72 }}>
      {/* Edit mode remove button */}
      {editMode && (
        <button
          type="button"
          data-no-drag
          onClick={onRemove}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/90 active:bg-red-400"
          aria-label={`Remove ${item.ticker}`}
        >
          <X className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </button>
      )}

      {/* Company logo */}
      <button
        type="button"
        data-no-drag
        onClick={editMode ? undefined : onTap}
        className="flex flex-1 items-center gap-3 text-left"
        disabled={editMode}
      >
        <div className="shrink-0 overflow-hidden rounded-xl">
          <CompanyLogo ticker={item.ticker} color={meta.logoColor} size={44} shape="square" />
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold tracking-tight text-white">{item.ticker}</p>
          <p className="truncate text-[12px] text-zinc-500">{meta.companyName}</p>
        </div>

        {/* Price */}
        {stock && showPrice && (
          <div className="shrink-0 text-right">
            <p className="text-[14px] font-semibold tabular-nums text-white">
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

        {/* Chevron */}
        {!editMode && (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

/* ─── Theme row ─────────────────────────────────────────────────────────── */

interface ThemeRowProps {
  item: WatchlistItem;
  editMode: boolean;
  onTap: () => void;
  onRemove: () => void;
}

function ThemeRow({ item, editMode, onTap, onRemove }: ThemeRowProps) {
  const { title, Icon } = getThemeMeta(item.ticker);

  return (
    <div className="flex items-center gap-3 px-4 py-3 active:bg-white/[0.03]" style={{ minHeight: 72 }}>
      {/* Edit mode remove button */}
      {editMode && (
        <button
          type="button"
          data-no-drag
          onClick={onRemove}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/90 active:bg-red-400"
          aria-label={`Remove ${title}`}
        >
          <X className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </button>
      )}

      <button
        type="button"
        data-no-drag
        onClick={editMode ? undefined : onTap}
        className="flex flex-1 items-center gap-3 text-left"
        disabled={editMode}
      >
        {/* Icon tile */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Icon className="h-5 w-5 text-zinc-400" strokeWidth={1.75} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold tracking-tight text-white">{title}</p>
          <p className="line-clamp-1 text-[12px] leading-snug text-zinc-500">
            {item.latestEntry.articleTitle}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-600">
            Updated {timeAgo(item.latestEntry.savedAt)}
          </p>
        </div>

        {!editMode && (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Compass className="h-7 w-7 text-zinc-600" strokeWidth={1.5} />
      </div>
      <p className="text-[15px] font-semibold text-white">No assets tracked yet</p>
      <p className="mt-1.5 max-w-[220px] text-[13px] leading-relaxed text-zinc-500">
        Add stocks from the Markets tab or any article
      </p>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */

export function WatchlistPage() {
  const { savedArticles, unsaveArticle } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState<WatchlistItem | null>(null);

  /* Deduplicated watchlist items */
  const watchlistItems = useMemo(
    () => buildWatchlistItems(savedArticles),
    [savedArticles]
  );

  const assets = useMemo(
    () => watchlistItems.filter((i) => i.type === "asset"),
    [watchlistItems]
  );

  const themes = useMemo(
    () => watchlistItems.filter((i) => i.type === "theme"),
    [watchlistItems]
  );

  /* Summary card — best/worst movers (assets with live price only) */
  const { bestTicker, bestPct, worstTicker, worstPct } = useMemo(() => {
    const movers = assets
      .filter((a) => shouldShowWatchlistPrice(a.ticker))
      .map((a) => ({ ticker: a.ticker, stock: getStockProfile(a.ticker) }))
      .filter((x) => x.stock !== null);

    if (movers.length === 0) {
      return { bestTicker: null, bestPct: null, worstTicker: null, worstPct: null };
    }

    const best = movers.reduce((b, c) =>
      (c.stock?.changePercent ?? -Infinity) > (b.stock?.changePercent ?? -Infinity) ? c : b
    );
    const worst = movers.reduce((w, c) =>
      (c.stock?.changePercent ?? Infinity) < (w.stock?.changePercent ?? Infinity) ? c : w
    );

    // Only show worst if it's genuinely negative (or different from best)
    const showWorst = worst.ticker !== best.ticker || (worst.stock?.changePercent ?? 0) < 0;

    return {
      bestTicker: best.ticker,
      bestPct: best.stock?.changePercent ?? null,
      worstTicker: showWorst ? worst.ticker : null,
      worstPct: showWorst ? (worst.stock?.changePercent ?? null) : null,
    };
  }, [assets]);

  /* 3 most recent articles from watched items */
  const latestArticles = useMemo(
    () =>
      savedArticles
        .slice()
        .sort(
          (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        )
        .slice(0, 3),
    [savedArticles]
  );

  /* Remove all entries for a ticker */
  const removeTicker = useCallback(
    async (item: WatchlistItem) => {
      for (const entry of item.allEntries) {
        await unsaveArticle(entry.articleId);
      }
    },
    [unsaveArticle]
  );

  /* ── Stock Panel overlay ── */
  if (activeItem) {
    return (
      <StockPanel
        article={articleFromEntry(activeItem.latestEntry, activeItem.ticker)}
        onBack={() => setActiveItem(null)}
      />
    );
  }

  /* ── Main view ── */
  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{ background: "#030305" }}
    >
      {/* Sticky header */}
      <header
        className="shrink-0 px-5 pb-3"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          background: "#030305",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-tight text-white">
            Watchlist
          </h1>
          {watchlistItems.length > 0 && (
            <button
              type="button"
              data-no-drag
              onClick={() => setEditMode((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                editMode
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 active:text-white"
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
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        {watchlistItems.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Summary card */}
            <SummaryCard
              assetCount={assets.length}
              themeCount={themes.length}
              bestTicker={bestTicker}
              bestPct={bestPct}
              worstTicker={worstTicker}
              worstPct={worstPct}
            />

            {/* Tracked assets */}
            {assets.length > 0 && (
              <section>
                <SectionHeader>Tracked assets</SectionHeader>
                <div className="mx-5 rounded-2xl" style={CARD_STYLE}>
                  <div className="divide-y divide-white/[0.05]">
                    {assets.map((item) => (
                      <AssetRow
                        key={item.ticker}
                        item={item}
                        editMode={editMode}
                        onTap={() => {
                          setEditMode(false);
                          setActiveItem(item);
                        }}
                        onRemove={() => void removeTicker(item)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Market themes */}
            {themes.length > 0 && (
              <section>
                <SectionHeader>Market themes</SectionHeader>
                <div className="mx-5 rounded-2xl" style={CARD_STYLE}>
                  <div className="divide-y divide-white/[0.05]">
                    {themes.map((item) => (
                      <ThemeRow
                        key={item.ticker}
                        item={item}
                        editMode={editMode}
                        onTap={() => {
                          setEditMode(false);
                          setActiveItem(item);
                        }}
                        onRemove={() => void removeTicker(item)}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Latest from your watchlist */}
            {latestArticles.length > 0 && (
              <section>
                <SectionHeader>Latest from your watchlist</SectionHeader>
                <div className="mx-5 rounded-2xl" style={CARD_STYLE}>
                  <div className="divide-y divide-white/[0.05]">
                    {latestArticles.map((entry) => {
                      const ticker = resolveSavedTicker(entry);
                      return (
                        <ProfileArticlePreview
                          key={entry.id}
                          title={entry.articleTitle}
                          source={ticker}
                          ticker={ticker}
                          timestamp={timeAgo(entry.savedAt)}
                          href={entry.articleUrl}
                          endIcon="link"
                        />
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
