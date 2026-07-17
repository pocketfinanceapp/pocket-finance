import { NextResponse } from "next/server";
import { fetchMarketauxNews } from "@/lib/marketauxApi";
import { mapMarketauxArticle } from "@/lib/newsMapper";

export const dynamic = "force-dynamic";

/**
 * Recent Marketaux-tagged headlines for a single entity/ticker — powers the
 * "Recent headlines" section on the company info panel (BusinessInfoPanel).
 * Separate from /api/marketaux/similar (which looks up coverage of one
 * specific story) and /api/marketaux/entity-stats (sentiment history only,
 * no headlines) — this is the "what's Marketaux got on this company lately"
 * lookup.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ articles: [] }, { status: 400 });
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(10, Math.max(1, parseInt(limitParam, 10) || 5))
    : 5;

  try {
    const raw = await fetchMarketauxNews({
      symbols: [symbol],
      mustHaveEntities: true,
      sort: "published_at",
    });
    const articles = raw.slice(0, limit).map(mapMarketauxArticle);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[marketaux] entity-news fetch threw:", err);
    return NextResponse.json({ articles: [] });
  }
}
