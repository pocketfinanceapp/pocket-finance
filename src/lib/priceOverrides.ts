export interface PriceOverride {
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Manual fixes for stale free-tier Massive data — no longer needed now that
 * Twelve Data (paid plan) is the live price source. Confirmed: this NVDA
 * entry was freezing NVDA's price at a fixed $131.38 forever, regardless of
 * the real live quote — /api/stock?ticker=NVDA was returning
 * "source":"override" instead of real-time data.
 */
export const PRICE_OVERRIDES: Record<string, PriceOverride> = {};

export function getPriceOverride(ticker: string): PriceOverride | undefined {
  return PRICE_OVERRIDES[ticker.toUpperCase()];
}

export function applyPriceOverride(
  ticker: string,
  quote: { price: number; change?: number; changePercent: number }
): PriceOverride {
  const override = getPriceOverride(ticker);
  if (override) return override;

  return {
    price: quote.price,
    change: quote.change ?? (quote.price * quote.changePercent) / 100,
    changePercent: quote.changePercent,
  };
}
