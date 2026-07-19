import { NextResponse } from "next/server";
import { fetchCountryNews } from "@/lib/marketauxApi";
import { mapMarketauxArticle } from "@/lib/newsMapper";

export const dynamic = "force-dynamic";

/** Real articles for a single country — backs "Browse by region" in Explore. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country");
  if (!country) {
    return NextResponse.json({ articles: [] }, { status: 400 });
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 40))
    : 40;

  try {
    const raw = await fetchCountryNews(country, limit);
    const articles = raw.map(mapMarketauxArticle);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[marketaux] country-news route threw:", err);
    return NextResponse.json({ articles: [] });
  }
}
