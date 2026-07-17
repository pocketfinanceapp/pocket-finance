import { NextResponse } from "next/server";
import { fetchEntitySentimentHistory } from "@/lib/marketauxApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ points: [] }, { status: 400 });
  }

  const daysParam = searchParams.get("days");
  const days = daysParam
    ? Math.min(90, Math.max(7, parseInt(daysParam, 10) || 30))
    : 30;

  const points = await fetchEntitySentimentHistory(symbol, days);
  return NextResponse.json({ points });
}
