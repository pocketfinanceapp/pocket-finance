/**
 * Tracks which ticker symbols have been explicitly dismissed from the Watchlist
 * by the user via Edit mode. Stored in localStorage so dismissals survive
 * page reloads without affecting the underlying Saved Articles data.
 *
 * When a user re-saves an article for a dismissed ticker (e.g. via StockPanel),
 * that ticker is automatically restored to the Watchlist.
 */

const STORAGE_KEY = "pf_watchlist_dismissed_v1";

function load(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function persist(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // quota exceeded or private mode — ignore
  }
}

/** Dismiss a ticker so it no longer shows in the Watchlist tab. */
export function dismissWatchlistTicker(ticker: string): void {
  const set = load();
  set.add(ticker.toUpperCase());
  persist(set);
}

/**
 * Restore a previously dismissed ticker — called automatically when the user
 * saves a new article for that ticker.
 */
export function restoreWatchlistTicker(ticker: string): void {
  const set = load();
  if (!set.has(ticker.toUpperCase())) return; // nothing to restore
  set.delete(ticker.toUpperCase());
  persist(set);
}

/** Returns the full set of currently dismissed ticker symbols (uppercase). */
export function getDismissedWatchlistTickers(): Set<string> {
  return load();
}
