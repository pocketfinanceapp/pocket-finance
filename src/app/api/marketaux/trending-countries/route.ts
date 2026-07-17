import { NextResponse } from "next/server";
import { fetchTrendingCountries } from "@/lib/marketauxApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 20))
    : 20;

  const countries = await fetchTrendingCountries({ limit, minDocCount: 1 });
  return NextResponse.json({ countries });
}
