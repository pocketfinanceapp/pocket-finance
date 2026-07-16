import type { StockQuote } from "./twelveDataApi";
import type { CompanyFundamentals } from "./twelveDataFundamentals";

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

export async function fetchStockFundamentals(
  ticker: string
): Promise<CompanyFundamentals | null> {
  try {
    const res = await fetch(
      `/api/fundamentals?ticker=${encodeURIComponent(ticker)}`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as CompanyFundamentals | null;
    if (data?.source === "twelvedata") {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}
