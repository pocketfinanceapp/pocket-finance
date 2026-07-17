import { isQuoteEligibleTicker } from "./usStockTickers";
import { toTwelveDataSymbol } from "./twelveDataSymbolOverrides";
import type { ChartPoint, ChartRange } from "./types";

export interface StockQuote {
  price: number;
  changePercent: number;
  change: number;
  source: "twelvedata" | "override";
  day?: { open: number; high: number; low: number; volume: number };
  week52High?: number;
  week52Low?: number;
}

interface TwelveDataQuoteResponse {
  status?: string;
  symbol?: string;
  close?: string;
  change?: string;
  percent_change?: string;
  open?: string;
  high?: string;
  low?: string;
  volume?: string;
  fifty_two_week?: {
    high?: string;
    low?: string;
  };
}

interface TwelveDataTimeSeriesResponse {
  status?: string;
  values?: Array<{
    datetime?: string;
    close?: string;
  }>;
}

const QUOTE_CACHE_TTL_MS = 45_000;
const quoteCache = new Map<
  string,
  { expiresAt: number; quotes: Record<string, StockQuote> }
>();

function parseQuote(
  data: TwelveDataQuoteResponse
): StockQuote | null {
  if (data.status === "error") return null;
  const price = Number(data.close);
  if (!Number.isFinite(price)) return null;

  return {
    price,
    change: Number(data.change),
    changePercent: Number(data.percent_change),
    source: "twelvedata",
    day: {
      open: Number(data.open),
      high: Number(data.high),
      low: Number(data.low),
      volume: Number(data.volume),
    },
    week52High: Number(data.fifty_two_week?.high),
    week52Low: Number(data.fifty_two_week?.low),
  };
}

/**
 * Fetch latest equity quote from Twelve Data (US + Venture-covered markets).
 */
export async function fetchStockPrice(
  ticker: string
): Promise<StockQuote | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  const symbol = ticker.toUpperCase();
  if (!isQuoteEligibleTicker(symbol)) return null;

  const requestSymbol = toTwelveDataSymbol(symbol);

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(requestSymbol)}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as TwelveDataQuoteResponse;
    return parseQuote(data);
  } catch {
    return null;
  }
}

const BATCH_SIZE = 40;

/**
 * Batch-fetch quotes for many app tickers. Returns a map keyed by the
 * original (display) ticker. Uses a short in-memory TTL to stay under
 * the plan credit budget when tabs re-fetch.
 */
export async function fetchQuotes(
  tickers: string[]
): Promise<Record<string, StockQuote>> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return {};

  const unique = [
    ...new Set(
      tickers
        .map((t) => t.trim().toUpperCase())
        .filter((t) => isQuoteEligibleTicker(t))
    ),
  ];
  if (unique.length === 0) return {};

  const cacheKey = unique.slice().sort().join(",");
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.quotes };
  }

  const appToTd = new Map<string, string>();
  const tdToApp = new Map<string, string>();
  for (const app of unique) {
    const td = toTwelveDataSymbol(app);
    appToTd.set(app, td);
    tdToApp.set(td, app);
  }

  const tdSymbols = [...appToTd.values()];
  const result: Record<string, StockQuote> = {};

  for (let i = 0; i < tdSymbols.length; i += BATCH_SIZE) {
    const chunk = tdSymbols.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch(
        `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(chunk.join(","))}&apikey=${apiKey}`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;

      const data = (await res.json()) as
        | TwelveDataQuoteResponse
        | Record<string, TwelveDataQuoteResponse>;

      if (chunk.length === 1) {
        const quote = parseQuote(data as TwelveDataQuoteResponse);
        const app = tdToApp.get(chunk[0]);
        if (quote && app) result[app] = quote;
        continue;
      }

      const map = data as Record<string, TwelveDataQuoteResponse>;
      for (const [tdSym, payload] of Object.entries(map)) {
        const quote = parseQuote(payload);
        const app = tdToApp.get(tdSym) ?? tdToApp.get(tdSym.toUpperCase());
        if (quote && app) result[app] = quote;
      }
    } catch {
      // skip chunk
    }
  }

  quoteCache.set(cacheKey, {
    expiresAt: Date.now() + QUOTE_CACHE_TTL_MS,
    quotes: result,
  });

  return result;
}

const CHART_RANGE_CONFIG: Record<
  ChartRange,
  { interval: string; outputsize: number }
> = {
  "1D": { interval: "5min", outputsize: 78 },
  "1W": { interval: "1h", outputsize: 56 },
  "1M": { interval: "1day", outputsize: 22 },
  "3M": { interval: "1day", outputsize: 66 },
  "1Y": { interval: "1day", outputsize: 252 },
  "5Y": { interval: "1week", outputsize: 260 },
  MAX: { interval: "1month", outputsize: 5000 },
};

function formatChartLabel(datetime: string, range: ChartRange): string {
  const d = new Date(datetime.includes("T") ? datetime : datetime.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return datetime;

  if (range === "1D") {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (range === "1W" || range === "1M" || range === "3M") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "1Y" || range === "5Y") {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/**
 * Historical OHLCV closes from Twelve Data /time_series for chart ranges.
 * MAX uses monthly bars with a large outputsize (full listing history).
 */
export async function fetchChartSeries(
  ticker: string,
  range: ChartRange
): Promise<ChartPoint[] | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  const symbol = ticker.toUpperCase();
  if (!isQuoteEligibleTicker(symbol)) return null;

  const requestSymbol = toTwelveDataSymbol(symbol);
  const { interval, outputsize } = CHART_RANGE_CONFIG[range];

  try {
    const url =
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(requestSymbol)}` +
      `&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const data = (await res.json()) as TwelveDataTimeSeriesResponse;
    if (data.status === "error" || !data.values?.length) return null;

    // Twelve Data returns newest-first; chart needs oldest-first.
    const points: ChartPoint[] = [];
    for (let i = data.values.length - 1; i >= 0; i--) {
      const row = data.values[i];
      const price = Number(row.close);
      if (!Number.isFinite(price) || !row.datetime) continue;
      points.push({
        time: formatChartLabel(row.datetime, range),
        price,
      });
    }

    return points.length > 0 ? points : null;
  } catch {
    return null;
  }
}
