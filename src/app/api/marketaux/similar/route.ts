import { NextResponse } from "next/server";
import { fetchSimilarArticles } from "@/lib/marketauxApi";
import { mapMarketauxArticle } from "@/lib/newsMapper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get("uuid");
  if (!uuid) {
    return NextResponse.json({ articles: [] }, { status: 400 });
  }

  const articles = await fetchSimilarArticles(uuid, 6);
  return NextResponse.json({ articles: articles.map(mapMarketauxArticle) });
}
