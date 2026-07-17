import { NextResponse } from "next/server";
import { fetchQuotes } from "@/lib/twelveDataApi";
import { getPriceOverride } from "@/lib/priceOverrides";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("symbols")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "symbols is required" }, { status: 400 });
  }

  const tickers = raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (tickers.length === 0) {
    return NextResponse.json({ error: "symbols is required" }, { status: 400 });
  }

  const quotes = await fetchQuotes(tickers);

  for (const ticker of Object.keys(quotes)) {
    const override = getPriceOverride(ticker);
    if (override) {
      quotes[ticker] = {
        price: override.price,
        change: override.change,
        changePercent: override.changePercent,
        source: "override",
      };
    }
  }

  return NextResponse.json({ quotes });
}
