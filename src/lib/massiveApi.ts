import { isUsListedStockTicker } from "./usStockTickers";

const MASSIVE_BASE = "https://api.massive.com";

export interface MassiveDayStats {
  open: number;
  high: number;
  low: number;
  volume: number;
}

export interface MassiveStockQuote {
  price: number;
  changePercent: number;
  change: number;
  source: "massive" | "override";
  day?: MassiveDayStats;
  week52High?: number;
  week52Low?: number;
}

interface LastTradeResponse {
  status?: string;
  results?: { p?: number };
}

interface SnapshotResponse {
  status?: string;
  ticker?: {
    todaysChange?: number;
    todaysChangePerc?: number;
    lastTrade?: { p?: number };
    day?: { o?: number; h?: number; l?: number; v?: number };
    prevDay?: { o?: number; h?: number; l?: number; v?: number };
    min?: { c?: number };
    max?: { c?: number };
  };
}

/**
 * Fetch latest US stock price from Massive last-trade endpoint.
 * % change is supplemented from the Massive snapshot (not in last-trade).
 *
 * Vercel: add MASSIVE_API_KEY in Project Settings → Environment Variables
 * for Production, Preview, and Development.
 */
export async function fetchStockPrice(
  ticker: string
): Promise<MassiveStockQuote | null> {
  const apiKey = process.env.MASSIVE_API_KEY;
  if (!apiKey) return null;

  const symbol = ticker.toUpperCase();
  if (!isUsListedStockTicker(symbol)) return null;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  try {
    const [tradeRes, snapshotRes] = await Promise.all([
      fetch(`${MASSIVE_BASE}/v2/last/trade/${encodeURIComponent(symbol)}`, {
        headers,
        cache: "no-store",
      }),
      fetch(
        `${MASSIVE_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${encodeURIComponent(symbol)}`,
        { headers, cache: "no-store" }
      ),
    ]);

    let price: number | null = null;
    let changePercent: number | null = null;
    let change: number | null = null;
    let day: MassiveDayStats | undefined;
    let week52High: number | undefined;
    let week52Low: number | undefined;

    if (tradeRes.ok) {
      const tradeData = (await tradeRes.json()) as LastTradeResponse;
      if (tradeData.status === "OK" && typeof tradeData.results?.p === "number") {
        price = tradeData.results.p;
      }
    }

    if (snapshotRes.ok) {
      const snapshotData = (await snapshotRes.json()) as SnapshotResponse;
      const snap = snapshotData.ticker;
      if (typeof snap?.todaysChangePerc === "number") {
        changePercent = snap.todaysChangePerc;
      }
      if (typeof snap?.todaysChange === "number") {
        change = snap.todaysChange;
      }
      if (price === null && typeof snap?.lastTrade?.p === "number") {
        price = snap.lastTrade.p;
      }
      const dayBar = snap?.day;
      if (
        typeof dayBar?.o === "number" &&
        typeof dayBar?.h === "number" &&
        typeof dayBar?.l === "number" &&
        typeof dayBar?.v === "number"
      ) {
        day = {
          open: dayBar.o,
          high: dayBar.h,
          low: dayBar.l,
          volume: dayBar.v,
        };
      }
      if (typeof snap?.max?.c === "number") week52High = snap.max.c;
      if (typeof snap?.min?.c === "number") week52Low = snap.min.c;
    }

    if (price === null || changePercent === null) return null;

    return {
      price,
      changePercent,
      change: change ?? (price * changePercent) / 100,
      source: "massive",
      day,
      week52High,
      week52Low,
    };
  } catch {
    return null;
  }
}
