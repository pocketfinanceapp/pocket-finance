import type { NewsArticle, SavedArticleEntry } from "./types";
import { getTickerMetaBySymbol, resolveSavedTicker } from "./tickerMap";
import { isMarketThemeTicker } from "./marketThemes";

export interface WatchlistItem {
  ticker: string;
  type: "asset" | "theme";
  /** Most recent saved entry for this ticker — used for headline + timestamp */
  latestEntry: SavedArticleEntry;
  /** All saved entries for this ticker — used for context/display */
  allEntries: SavedArticleEntry[];
}

/**
 * Groups savedArticles by canonical ticker key, deduplicates, and classifies
 * each item as "asset" (tradeable ticker) or "theme" (market category).
 * Use this as the single source of truth for Watchlist item counts and display.
 */
export function buildWatchlistItems(
  savedArticles: SavedArticleEntry[]
): WatchlistItem[] {
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

  // Sort by most recently added overall
  return items.sort(
    (a, b) =>
      new Date(b.latestEntry.savedAt).getTime() -
      new Date(a.latestEntry.savedAt).getTime()
  );
}

/** Minimal in-app article when the feed cache does not have this id */
export function articleFromSavedEntry(entry: SavedArticleEntry): NewsArticle {
  const ticker = resolveSavedTicker(entry);
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
    tags: meta.tags,
    publishedAt: entry.savedAt,
    sourceName: "",
    sourceId: null,
    sourceUrl: entry.articleUrl,
    likes: 0,
    comments: 0,
    shares: 0,
  };
}

/** Prefer full feed article; fall back to saved-entry stub for in-app reading */
export function resolveSavedArticle(
  entry: SavedArticleEntry,
  articlesById: Map<string, NewsArticle>
): NewsArticle {
  return articlesById.get(entry.articleId) ?? articleFromSavedEntry(entry);
}
