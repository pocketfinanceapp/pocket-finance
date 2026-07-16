import type { StockQuote } from "./twelveDataApi";

export async function fetchStockQuote(
  ticker: string
): Promise<StockQuote | null> {
  try {
    const res = await fetch(`/api/stock?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;

    const data = (await res.json()) as StockQuote | null;
    if (data?.source === "twelvedata" || data?.source === "override") {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}
