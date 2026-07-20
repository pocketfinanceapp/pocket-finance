import { hasUsableFeedImage } from "./feedImage";
import { filterFinanceArticles } from "./financeRelevance";
import { mapMarketauxArticle } from "./newsMapper";
import { fetchMarketauxNews } from "./marketauxApi";
import type { NewsArticle } from "./types";

const MAIN_FEED_CAP = 60;
const TRENDING_CAP = 40;

async function fetchTrendingFromMarketaux(): Promise<NewsArticle[]> {
  const articles = await fetchMarketauxNews({
    mustHaveEntities: true,
    sort: "entity_match_score",
  });
  return articles.map(mapMarketauxArticle);
}

async function fetchMainFeedFromMarketaux(): Promise<NewsArticle[]> {
  const articles = await fetchMarketauxNews({ mustHaveEntities: true });
  return filterFinanceArticles(articles.map(mapMarketauxArticle));
}

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
