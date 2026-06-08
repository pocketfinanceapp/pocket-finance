import { NextResponse } from "next/server";
import { fetchStockPrice } from "@/lib/massiveApi";
import { getPriceOverride } from "@/lib/priceOverrides";

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
  const override = getPriceOverride(symbol);

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
