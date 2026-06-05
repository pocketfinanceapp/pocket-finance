import { NextResponse } from "next/server";
import { fetchNewsArticles } from "@/lib/fetchNews";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await fetchNewsArticles();
  return NextResponse.json({ articles });
}
