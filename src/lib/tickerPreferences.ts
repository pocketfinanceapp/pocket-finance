const KEY = "pocket-followed-tickers";

/** Specific companies the user has chosen to follow — boosts them in the
 * For You feed. Device-local like followedMarkets/sectorInterests, not
 * gated behind sign-in. */
export function loadFollowedTickers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed)
      ? parsed.filter(Boolean).map((t) => t.toUpperCase())
      : [];
  } catch {
    return [];
  }
}

export function saveFollowedTickers(tickers: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(tickers));
  } catch {
    /* storage blocked */
  }
}
