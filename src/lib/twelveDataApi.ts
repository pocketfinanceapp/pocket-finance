import { isUsListedStockTicker } from "./usStockTickers";
import { toTwelveDataSymbol } from "./twelveDataSymbolOverrides";

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

/**
 * Fetch latest US stock quote from Twelve Data.
 *
 * Vercel: add TWELVE_DATA_API_KEY in Project Settings → Environment Variables
 * for Production, Preview, and Development.
 */
export async function fetchStockPrice(
  ticker: string
): Promise<StockQuote | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  const symbol = ticker.toUpperCase();
  if (!isUsListedStockTicker(symbol)) return null;

  const requestSymbol = toTwelveDataSymbol(symbol);

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(requestSymbol)}&apikey=${apiKey}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as TwelveDataQuoteResponse;
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
  } catch {
    return null;
  }
}
