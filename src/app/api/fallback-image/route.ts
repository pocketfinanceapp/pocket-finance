import { NextResponse } from "next/server";
import { fetchCategoryFallbackImage } from "@/lib/categoryFallbackImage";
import type { FeedFallbackVariant } from "@/lib/feedFallbackVariant";

const VALID_VARIANTS = new Set<FeedFallbackVariant>([
  "crypto",
  "mining",
  "energy",
  "finance",
  "tech",
  "markets",
]);

function isFeedFallbackVariant(value: string): value is FeedFallbackVariant {
  return VALID_VARIANTS.has(value as FeedFallbackVariant);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category || !isFeedFallbackVariant(category)) {
    return NextResponse.json({ imageUrl: null }, { status: 400 });
  }

  const imageUrl = await fetchCategoryFallbackImage(category);
  return NextResponse.json({ imageUrl });
}
