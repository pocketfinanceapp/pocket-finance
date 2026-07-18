/**
 * Real, topic-relevant photos for the feed card fallback background —
 * shown when an article has no usable image of its own. Previously this
 * fallback was abstract line-art only; this adds an actual photo behind
 * it, sourced from Wikipedia's free, keyless public image API (same
 * approach as companyInfo.ts). One fixed, evergreen topic per category —
 * not per-article — so this is cheap to fetch and cache for a long time.
 *
 * Resilient by design: if a title has no image, or the request fails, we
 * return null and the caller keeps showing the existing abstract art.
 * Nothing here is guessed or fabricated.
 */

import type { FeedFallbackVariant } from "./feedFallbackVariant";

const WIKIPEDIA_ACTION_API = "https://en.wikipedia.org/w/api.php";

// A week — this is a fixed, generic topic photo, not live data.
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;

const THUMB_WIDTH = 900;

const CATEGORY_WIKI_TITLES: Record<FeedFallbackVariant, string> = {
  crypto: "Bitcoin",
  mining: "Mining",
  energy: "Oil platform",
  finance: "Wall Street",
  tech: "Data center",
  markets: "New York Stock Exchange",
};

interface PageImagesResponse {
  query?: {
    pages?: Record<
      string,
      {
        thumbnail?: { source?: string; width?: number; height?: number };
      }
    >;
  };
}

export async function fetchCategoryFallbackImage(
  variant: FeedFallbackVariant
): Promise<string | null> {
  const title = CATEGORY_WIKI_TITLES[variant];
  if (!title) return null;

  const url = `${WIKIPEDIA_ACTION_API}?action=query&titles=${encodeURIComponent(
    title
  )}&prop=pageimages&format=json&pithumbsize=${THUMB_WIDTH}&origin=*`;

  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "PocketFinance/1.0 (news app; contact via app)" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as PageImagesResponse;
    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    return page?.thumbnail?.source ?? null;
  } catch (err) {
    console.error(`[categoryFallbackImage] fetch threw for ${variant}:`, err);
    return null;
  }
}
