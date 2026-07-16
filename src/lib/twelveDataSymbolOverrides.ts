/**
 * A handful of tickers in our catalog don't resolve correctly against Twelve
 * Data using the bare symbol we display in the app. Confirmed case: "BRK"
 * alone returns garbage data (market cap off by ~50x) — Twelve Data needs
 * the share-class suffix. This maps our display ticker to the symbol we
 * actually send to Twelve Data's /quote and /statistics endpoints.
 */
const TWELVE_DATA_SYMBOL_OVERRIDES: Record<string, string> = {
  BRK: "BRK.B",
};

export function toTwelveDataSymbol(ticker: string): string {
  const upper = ticker.trim().toUpperCase();
  return TWELVE_DATA_SYMBOL_OVERRIDES[upper] ?? upper;
}
