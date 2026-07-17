import { NextResponse } from "next/server";
import { fetchTrendingEntities } from "@/lib/marketauxApi";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 12))
    : 12;

  const entities = await fetchTrendingEntities({ limit, minDocCount: 2 });
  return NextResponse.json({ entities });
}
