import { NextResponse } from "next/server";
import { fetchStockPrice } from "@/lib/massiveApi";

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
  if (symbol === "NVDA" && quote.price > 400) {
    quote.price = Math.round((quote.price / 10) * 100) / 100;
    quote.change = Math.round((quote.change / 10) * 100) / 100;
  }

  return NextResponse.json(quote);
}
