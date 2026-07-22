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

    // Marketaux's symbols filter includes an article as long as the
    // requested ticker is *one of* its matched entities — even a weak,
    // passing-mention match. That let e.g. a "Ryanair Passenger Partly
    // Sucked From Jet After Window Breaks" story (Ryanair is clearly the
    // subject) show up in Alaska Air Group's "Recent headlines" just
    // because ALK was mentioned incidentally, with a far lower matchScore
    // than Ryanair's own entity. Only keep articles where the requested
    // symbol is genuinely the *top*-scored entity, i.e. actually what the
    // story is about.
    const upperSymbol = symbol.toUpperCase();
    const primaryTopicOnly = raw.filter((article) => {
      if (article.entities.length <= 1) return true;
      const topEntity = [...article.entities].sort(
        (a, b) => b.matchScore - a.matchScore
      )[0];
      return topEntity.symbol.toUpperCase() === upperSymbol;
    });

    const articles = primaryTopicOnly.slice(0, limit).map(mapMarketauxArticle);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[marketaux] entity-news fetch threw:", err);
    return NextResponse.json({ articles: [] });
  }
}
