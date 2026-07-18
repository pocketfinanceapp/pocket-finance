import { NextResponse } from "next/server";
import {
  fetchCategoryFallbackImage,
  fetchWikipediaPageImage,
} from "@/lib/categoryFallbackImage";
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

  // TEMPORARY: lets us test candidate Wikipedia titles directly against
  // the live deployment (?title=...) instead of a guess/push/wait loop.
  // Remove once the "markets" fallback photo is confirmed working.
  const debugTitle = searchParams.get("title");
  if (debugTitle) {
    const imageUrl = await fetchWikipediaPageImage(debugTitle);
    return NextResponse.json({ title: debugTitle, imageUrl });
  }

  if (!category || !isFeedFallbackVariant(category)) {
    return NextResponse.json({ imageUrl: null }, { status: 400 });
  }

  const imageUrl = await fetchCategoryFallbackImage(category);
  return NextResponse.json({ imageUrl });
}
