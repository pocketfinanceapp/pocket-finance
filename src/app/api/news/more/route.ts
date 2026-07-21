import { NextRequest, NextResponse } from "next/server";
import { fetchMoreNewsArticles } from "@/lib/fetchNews";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rawPage = Number(req.nextUrl.searchParams.get("page") ?? "2");
  const page = Number.isFinite(rawPage) && rawPage >= 2 ? Math.floor(rawPage) : 2;
  const articles = await fetchMoreNewsArticles(page);
  return NextResponse.json({ articles });
}
