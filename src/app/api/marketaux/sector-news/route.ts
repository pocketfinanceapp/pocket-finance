import { NextResponse } from "next/server";
import { fetchSectorNews } from "@/lib/marketauxApi";
import { mapMarketauxArticle } from "@/lib/newsMapper";
import { SECTOR_FILTERS, type SectorFilter } from "@/lib/filters";

export const dynamic = "force-dynamic";

const VALID_SECTORS = new Set<string>(SECTOR_FILTERS);

/** Real articles for a single sector — backs "Browse by topic" in Explore. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get("sector");
  if (!sector || !VALID_SECTORS.has(sector)) {
    return NextResponse.json({ articles: [] }, { status: 400 });
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 40))
    : 40;

  try {
    const raw = await fetchSectorNews(sector as SectorFilter, limit);
    const articles = raw.map(mapMarketauxArticle);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[marketaux] sector-news route threw:", err);
    return NextResponse.json({ articles: [] });
  }
}
