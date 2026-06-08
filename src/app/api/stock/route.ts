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

  return NextResponse.json(quote);
}
