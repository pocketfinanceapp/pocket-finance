import type { StockQuote } from "./twelveDataApi";
import type { CompanyFundamentals } from "./twelveDataFundamentals";
import type { ChartPoint, ChartRange } from "./types";

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

export async function fetchQuotes(
  tickers: string[]
): Promise<Record<string, StockQuote>> {
  if (tickers.length === 0) return {};
  try {
    const res = await fetch(
      `/api/quotes?symbols=${encodeURIComponent(tickers.join(","))}`
    );
    if (!res.ok) return {};
    const data = (await res.json()) as { quotes?: Record<string, StockQuote> };
    return data.quotes ?? {};
  } catch {
    return {};
  }
}

export async function fetchChartPoints(
  ticker: string,
  range: ChartRange
): Promise<ChartPoint[] | null> {
  try {
    const res = await fetch(
      `/api/chart?ticker=${encodeURIComponent(ticker)}&range=${encodeURIComponent(range)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { points?: ChartPoint[] } | null;
    return data?.points ?? null;
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
