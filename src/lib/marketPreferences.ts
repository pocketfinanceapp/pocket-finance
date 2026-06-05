import type { MarketFilter } from "./filters";

const KEY = "pocket-followed-markets";

export function loadFollowedMarkets(): MarketFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter(Boolean) as MarketFilter[];
  } catch {
    return [];
  }
}

export function saveFollowedMarkets(markets: MarketFilter[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(markets));
}
