import type { SavedArticleEntry } from "./types";
import { resolveSavedTicker } from "./tickerMap";
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
