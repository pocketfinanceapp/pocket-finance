import { hasUsableFeedImage } from "./feedImage";
import { filterFinanceArticles } from "./financeRelevance";
import { mapMarketauxArticle } from "./newsMapper";
import { fetchMarketauxNews } from "./marketauxApi";
import type { NewsArticle } from "./types";

const MAIN_FEED_CAP = 60;
const TRENDING_CAP = 40;

// Same window as the underlying fetch()'s `next: { revalidate: 1800 }`.
const DEDUPE_WINDOW_MS = 1800 * 1000;

/**
 * Single-flight + short-lived memoization, keyed at the module level (not
 * per-request like React's `cache()`). This matters because `/home/layout.tsx`
 * is a shared layout that Next.js re-executes independently for every
 * statically generated /home/* route (7 of them) during a build — without
 * this, that fired ~14 near-simultaneous identical Marketaux requests
 * before Next's own fetch cache had a chance to populate, and several
 * would time out under that burst. Concurrent/rapid calls within the same
 * process now share one in-flight promise instead of duplicating the
 * network call.
 */
function singleFlight<T>(fn: () => Promise<T>) {
  let inFlight: Promise<T> | null = null;
  let cachedAt = 0;

  return (): Promise<T> => {
    const now = Date.now();
    if (!inFlight || now - cachedAt > DEDUPE_WINDOW_MS) {
      cachedAt = now;
      inFlight = fn().catch((err) => {
        // Don't let a failed call poison the cache for the dedupe window —
        // let the next call retry instead of returning a stale rejection.
        inFlight = null;
        throw err;
      });
    }
    return inFlight;
  };
}

async function fetchTrendingFromMarketauxUncached(): Promise<NewsArticle[]> {
  const articles = await fetchMarketauxNews({
    mustHaveEntities: true,
    sort: "entity_match_score",
  });
  return articles.map(mapMarketauxArticle);
}

async function fetchMainFeedFromMarketauxUncached(): Promise<NewsArticle[]> {
  // Explicit sort, not relying on Marketaux's documented default — this is
  // the pool the "For You" timeline is built from, so guaranteeing
  // newest-first at the API level (not just in our own client-side
  // re-ranking) is worth being explicit about rather than implicit.
  const articles = await fetchMarketauxNews({
    mustHaveEntities: true,
    sort: "published_at",
  });
  return filterFinanceArticles(articles.map(mapMarketauxArticle));
}

const fetchTrendingFromMarketaux = singleFlight(fetchTrendingFromMarketauxUncached);
const fetchMainFeedFromMarketaux = singleFlight(fetchMainFeedFromMarketauxUncached);

/** Drops duplicate ids (by first-seen order) and caps the result. */
function capArticles(articles: NewsArticle[], cap: number): NewsArticle[] {
  const seen = new Set<string>();
  const result: NewsArticle[] = [];
  for (const a of articles) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    result.push(a);
    if (result.length >= cap) break;
  }
  return result;
}

/**
 * Drops articles without a usable hero image — this is a full-screen photo
 * feed, so we'd rather not surface an image-less story than lean on
 * per-card fallback art for real news.
 */
function withUsableImage(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter((a) => hasUsableFeedImage(a.imageUrl));
}

/**
 * No placeholder/demo content exists in this app anymore — if Marketaux
 * comes back empty, this returns an empty array and the UI's existing "No
 * stories match" empty state handles it. We never want to show fabricated
 * stories misattributed to real publishers.
 */
export async function fetchTrendingNewsArticles(): Promise<NewsArticle[]> {
  if (!process.env.MARKETAUX_API_KEY) {
    console.error("[fetchNews] MARKETAUX_API_KEY is not set — trending feed will be empty");
    return [];
  }

  try {
    const articles = await fetchTrendingFromMarketaux();
    return capArticles(withUsableImage(articles), TRENDING_CAP);
  } catch (err) {
    console.error("[fetchNews] Marketaux trending threw:", err);
    return [];
  }
}

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  if (!process.env.MARKETAUX_API_KEY) {
    console.error("[fetchNews] MARKETAUX_API_KEY is not set — main feed will be empty");
    return [];
  }

  try {
    const articles = await fetchMainFeedFromMarketaux();
    return capArticles(withUsableImage(articles), MAIN_FEED_CAP);
  } catch (err) {
    console.error("[fetchNews] Marketaux main feed threw:", err);
    return [];
  }
}

/**
 * Additional pages of the main feed, fetched on demand as the user scrolls
 * near the end of what's already loaded — powers infinite scroll instead of
 * capping the feed at the initial ~60-article page. Deliberately not
 * single-flighted like fetchMainFeedFromMarketaux above: each page number is
 * its own distinct request (different cache key), triggered one at a time
 * client-side rather than in a build-time burst, so there's no thundering-
 * herd risk to guard against here.
 */
export async function fetchMoreNewsArticles(page: number): Promise<NewsArticle[]> {
  if (!process.env.MARKETAUX_API_KEY) return [];
  if (page < 2) return [];

  try {
    const articles = await fetchMarketauxNews({
      mustHaveEntities: true,
      sort: "published_at",
      page,
    });
    const mapped = filterFinanceArticles(articles.map(mapMarketauxArticle));
    return capArticles(withUsableImage(mapped), MAIN_FEED_CAP);
  } catch (err) {
    console.error("[fetchNews] Marketaux more-pages fetch threw:", err);
    return [];
  }
}
