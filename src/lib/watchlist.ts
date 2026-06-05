import type { WatchlistEntry } from "./types";
import { getStockProfile } from "./stockData";

const KEY = "pocket-finance-watchlist";

export function loadWatchlist(): WatchlistEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WatchlistEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(entries: WatchlistEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function entryFromTicker(ticker: string): WatchlistEntry {
  const stock = getStockProfile(ticker);
  return {
    ticker: stock.ticker,
    name: stock.name,
    price: stock.price,
    changePercent: stock.changePercent,
    logoColor: stock.logoColor,
    savedAt: new Date().toISOString(),
  };
}
