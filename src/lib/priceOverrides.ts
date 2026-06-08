export interface PriceOverride {
  price: number;
  change: number;
  changePercent: number;
}

/** Manual fixes for stale free-tier Massive data — remove when on paid plan */
export const PRICE_OVERRIDES: Record<string, PriceOverride> = {
  NVDA: { price: 131.38, change: -3.07, changePercent: -2.29 },
};

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
