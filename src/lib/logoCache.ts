import { getCompanyLogoUrls } from "./companyLogos";

const STORAGE_KEY = "pf-logo-cache-v2";

const resolvedByTicker = new Map<string, string>();
const exhaustedTickers = new Set<string>();
const failedPairs = new Set<string>();
const inflight = new Map<string, Promise<string | null>>();

function pairKey(ticker: string, url: string): string {
  return `${ticker}|${url}`;
}

function loadPersistedCache(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [ticker, url] of Object.entries(parsed)) {
      resolvedByTicker.set(ticker.toUpperCase(), url);
    }
  } catch {
    // ignore corrupt cache
  }
}

function persistCache(): void {
  if (typeof window === "undefined") return;
  try {
    const payload: Record<string, string> = {};
    for (const [ticker, url] of resolvedByTicker) {
      payload[ticker] = url;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

loadPersistedCache();

function probeImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.decoding = "async";
    img.src = url;
  });
}

export function getCachedLogoUrl(ticker: string): string | null {
  return resolvedByTicker.get(ticker.trim().toUpperCase()) ?? null;
}

export function isLogoExhausted(ticker: string): boolean {
  return exhaustedTickers.has(ticker.trim().toUpperCase());
}

function markSuccess(ticker: string, url: string): string {
  const upper = ticker.trim().toUpperCase();
  resolvedByTicker.set(upper, url);
  exhaustedTickers.delete(upper);
  persistCache();
  return url;
}

function markFailure(ticker: string, url: string): void {
  failedPairs.add(pairKey(ticker.trim().toUpperCase(), url));
}

function markExhausted(ticker: string): void {
  exhaustedTickers.add(ticker.trim().toUpperCase());
}

/** Resolve the first working logo URL for a ticker (cached after first success). */
export async function resolveCompanyLogo(ticker: string): Promise<string | null> {
  const upper = ticker.trim().toUpperCase();
  if (!upper) return null;

  const cached = resolvedByTicker.get(upper);
  if (cached) return cached;
  if (exhaustedTickers.has(upper)) return null;

  const existing = inflight.get(upper);
  if (existing) return existing;

  const task = (async () => {
    for (const url of getCompanyLogoUrls(upper)) {
      if (failedPairs.has(pairKey(upper, url))) continue;
      if (await probeImage(url)) {
        return markSuccess(upper, url);
      }
      markFailure(upper, url);
    }
    markExhausted(upper);
    return null;
  })();

  inflight.set(upper, task);
  try {
    return await task;
  } finally {
    inflight.delete(upper);
  }
}

/** Warm the cache for a batch of tickers (e.g. Companies tab). */
export function prefetchCompanyLogos(tickers: string[]): void {
  const unique = [...new Set(tickers.map((t) => t.trim().toUpperCase()).filter(Boolean))];
  for (const ticker of unique) {
    if (resolvedByTicker.has(ticker) || exhaustedTickers.has(ticker)) continue;
    void resolveCompanyLogo(ticker);
  }
}
