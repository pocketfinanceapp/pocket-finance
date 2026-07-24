import { NextResponse } from "next/server";
import { fetchSearchNews } from "@/lib/marketauxApi";
import { mapMarketauxArticle } from "@/lib/newsMapper";

export const dynamic = "force-dynamic";

/** Real, live-searched articles — backs the in-app search box. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json({ articles: [] });
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam
    ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 30))
    : 30;

  try {
    const raw = await fetchSearchNews(q, limit);
    const articles = raw.map(mapMarketauxArticle);
    return NextResponse.json({ articles });
  } catch (err) {
    console.error("[marketaux] search-news route threw:", err);
    return NextResponse.json({ articles: [] });
  }
}
