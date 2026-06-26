import type { MassiveStockQuote } from "./massiveApi";

export async function fetchStockQuote(
  ticker: string
): Promise<MassiveStockQuote | null> {
  try {
    const res = await fetch(`/api/stock?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;

    const data = (await res.json()) as MassiveStockQuote | null;
    if (data?.source === "massive" || data?.source === "override") {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}
