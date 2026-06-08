import { NextResponse } from "next/server";
import { fetchStockPrice } from "@/lib/massiveApi";

/** Manual fixes for stale free-tier Massive data — remove when on paid plan */
const PRICE_OVERRIDES: Record<
  string,
  { price: number; change: number; changePercent: number }
> = {
  NVDA: { price: 131.38, change: -3.07, changePercent: -2.29 },
};

export async function GET(request: Request) {
  const ticker = new URL(request.url).searchParams.get("ticker")?.trim();

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  const quote = await fetchStockPrice(ticker);

  if (!quote) {
    return NextResponse.json(null, { status: 404 });
  }

  const symbol = ticker.toUpperCase();
  const override = PRICE_OVERRIDES[symbol];

  if (override) {
    return NextResponse.json({
      price: override.price,
      change: override.change,
      changePercent: override.changePercent,
      source: "override",
    });
  }

  return NextResponse.json(quote);
}
