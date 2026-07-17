/**
 * Display ticker → Twelve Data request symbol.
 * Only include mappings verified against /quote on the Venture key.
 */
const TWELVE_DATA_SYMBOL_OVERRIDES: Record<string, string> = {
  BRK: "BRK.B",
  BIMBO: "BIMBOA",
  FEMSA: "FEMSAUBD",
  LVMH: "MC",
  SAM: "005930",
  RJHI: "1120",
};

/**
 * Tickers we intentionally exclude because Twelve Data cannot return a
 * reliable quote for our display symbol (404 / wrong instrument).
 */
export const UNQUOTABLE_TICKERS = new Set([
  "ARAMCO",
  "MAADEN",
  "SABIC",
  "STC",
]);

export function toTwelveDataSymbol(ticker: string): string {
  const upper = ticker.trim().toUpperCase();
  return TWELVE_DATA_SYMBOL_OVERRIDES[upper] ?? upper;
}

export function isUnquotableTicker(ticker: string): boolean {
  return UNQUOTABLE_TICKERS.has(ticker.trim().toUpperCase());
}
