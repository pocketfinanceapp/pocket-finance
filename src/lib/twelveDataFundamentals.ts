/**
 * Live company fundamentals from Twelve Data's /statistics endpoint.
 *
 * IMPORTANT COST NOTE: this endpoint costs 50 API credits per symbol (vs. 1
 * credit for a /quote call). The Venture plan has 610 credits/minute, so this
 * MUST stay cached — do not call it on every render or every page view.
 * We use Next.js's fetch cache with a 24h revalidate window so repeated
 * views of the same ticker within a day are free.
 */

import { toTwelveDataSymbol } from "./twelveDataSymbolOverrides";

export interface CompanyFundamentals {
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  /** Percent, e.g. 1.91 means 1.91% — already normalized, never a raw fraction. */
  dividendYield: number | null;
  revenue: number | null;
  ebitda: number | null;
  beta: number | null;
  sharesOutstanding: number | null;
  /** ISO date string (Twelve Data reports the most recent ex-dividend date, not a future one). */
  exDividendDate: string | null;
  source: "twelvedata";
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Twelve Data is inconsistent across endpoints about whether a "yield" field
 * is a fraction (0.0191) or already a percent (1.91). We can't confirm which
 * without a live call, so this defensively normalizes into a percent and
 * refuses to return an implausible value rather than guess wrong.
 */
function normalizeDividendYield(raw: unknown): number | null {
  const value = num(raw);
  if (value === null || value < 0) return null;
  if (value === 0) return 0;
  if (value < 1) return value * 100; // looks like a fraction (0.0191 -> 1.91%)
  if (value <= 25) return value; // already a sane percent
  return null; // implausible either way — don't show garbage
}

export async function fetchCompanyFundamentals(
  ticker: string
): Promise<CompanyFundamentals | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  const symbol = ticker.trim().toUpperCase();
  if (!symbol) return null;

  const requestSymbol = toTwelveDataSymbol(symbol);

  try {
    const res = await fetch(
      `https://api.twelvedata.com/statistics?symbol=${encodeURIComponent(requestSymbol)}&apikey=${apiKey}`,
      {
        // Next.js Data Cache: protects the 50-credit-per-symbol cost by
        // reusing the response for 24h across all users/requests.
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.status === "error" || !data.statistics) return null;

    const stats = data.statistics as Record<string, unknown>;
    const valuations = (stats.valuations_metrics ?? {}) as Record<string, unknown>;
    const financials = (stats.financials ?? {}) as Record<string, unknown>;
    const incomeStatement = (financials.income_statement ?? {}) as Record<
      string,
      unknown
    >;
    const stockStatistics = (stats.stock_statistics ?? {}) as Record<
      string,
      unknown
    >;
    const priceSummary = (stats.stock_price_summary ?? {}) as Record<
      string,
      unknown
    >;
    const dividends = (stats.dividends_and_splits ?? {}) as Record<
      string,
      unknown
    >;

    const exDividendDateRaw = dividends.ex_dividend_date;
    const exDividendDate =
      typeof exDividendDateRaw === "string" && exDividendDateRaw.trim()
        ? exDividendDateRaw
        : null;

    return {
      marketCap: num(valuations.market_capitalization),
      peRatio: num(valuations.trailing_pe),
      eps: num(incomeStatement.diluted_eps_ttm),
      dividendYield: normalizeDividendYield(
        dividends.trailing_annual_dividend_yield
      ),
      revenue: num(incomeStatement.revenue_ttm),
      ebitda: num(incomeStatement.ebitda),
      beta: num(priceSummary.beta),
      sharesOutstanding: num(stockStatistics.shares_outstanding),
      exDividendDate,
      source: "twelvedata",
    };
  } catch {
    return null;
  }
}
