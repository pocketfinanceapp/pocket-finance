import { NextResponse } from "next/server";
import { fetchChartSeries } from "@/lib/twelveDataApi";
import type { ChartRange } from "@/lib/types";

const VALID_RANGES = new Set<ChartRange>([
  "1D",
  "1W",
  "1M",
  "3M",
  "1Y",
  "5Y",
  "MAX",
]);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const ticker = params.get("ticker")?.trim();
  const range = params.get("range")?.trim() as ChartRange | undefined;

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }
  if (!range || !VALID_RANGES.has(range)) {
    return NextResponse.json({ error: "valid range is required" }, { status: 400 });
  }

  const points = await fetchChartSeries(ticker, range);
  if (!points) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json({ points });
}
