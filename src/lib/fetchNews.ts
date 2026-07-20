import { NEWS_API_BLOCKED_TERMS } from "./articleFilter";
import { isExcludedArticle } from "./articleText";
import { filterFinanceArticles } from "./financeRelevance";
import { hasUsableFeedImage } from "./feedImage";
import { mapNewsApiArticle, mapMarketauxArticle } from "./newsMapper";
import { fetchMarketauxNews } from "./marketauxApi";
import type { NewsArticle } from "./types";

const FINANCE_QUERY =
  "stocks OR markets OR earnings OR Fed OR investing OR shares OR NYSE OR NASDAQ OR ASX OR economy OR finance OR trading OR crypto OR bitcoin";

const TRENDING_QUERY =
  "market crash OR market surge OR earnings beat OR earnings miss OR Federal Reserve OR interest rate OR inflation OR IPO OR merger OR acquisition OR record high OR record low";

const EXCLUDED_QUERY =
  `accident OR accidents OR crime OR sports OR entertainment OR weather OR NFL OR NBA OR MLB OR NHL OR FIFA OR soccer OR football OR basketball OR baseball OR hockey OR tennis OR golf OR Olympics OR quarterback OR touchdown OR MVP OR playoff OR championship OR military OR troops OR war OR missile OR earthquake OR hurricane OR shooting OR gov.uk OR researchbuzz OR buzzfeed OR gizmodo OR mashable OR mlive OR huffpost OR dailymail OR tmz OR eonline OR usmagazine OR entertainment.yahoo OR "Yahoo Entertainment" OR ${NEWS_API_BLOCKED_TERMS}`;

const MAIN_FEED_CAP = 60;
const TRENDING_CAP = 40;
const NEWS_PAGE_SIZE = 100;
const MAX_NEWS_PAGES = 2;

interface NewsApiArticle {
  title?: string;
  description?: string | null;
  url?: string;
  content?: string | null;
  source?: { id?: string | null; name?: string };
}

function isFinanceArticle(article: NewsApiArticle): boolean {
  return !isExcludedArticle({
    title: article.title ?? "",
    description: article.description ?? "",
    url: article.url ?? "",
    sourceName: article.source?.name ?? "",
    sourceId: article.source?.id ?? null,
    content: article.content ?? "",
  });
}

async function fetchFromNewsApi(
  apiKey: string,
  query: string,
  page = 1
): Promise<NewsArticle[]> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", `${query} NOT (${EXCLUDED_QUERY})`);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(NEWS_PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("apiKey", apiKey);

  // Was `cache: "no-store"` with a cache-busting `_cb` timestamp param —
  // meaning this hit the live NewsAPI on literally every single page load
  // with no caching at all, which was the dominant contributor to the
  // ~10-12s cold load time (up to two sequential 8s-timeout requests, plus
  // a possible third backup request below, on every visit). NewsAPI's own
  // "everything" endpoint isn't second-by-second real-time anyway, so a
  // short revalidation window makes nearly all visits served from Next's
  // data cache instead, while still keeping the feed fresh within ~90s.
  const res = await fetch(url.toString(), {
    next: { revalidate: 90 },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `[fetchNews] NewsAPI HTTP ${res.status} ${res.statusText} (page ${page}): ${body.slice(0, 500)}`
    );
    return [];
  }

  const data = await res.json();
  return (data.articles ?? [])
    .filter(
      (a: NewsApiArticle) =>
        a.title && a.title !== "[Removed]" && isFinanceArticle(a)
    )
    .map((a: Parameters<typeof mapNewsApiArticle>[0]) => mapNewsApiArticle(a));
}

async function fetchPagedNews(
  apiKey: string,
  query: string,
  maxPages = MAX_NEWS_PAGES
): Promise<NewsArticle[]> {
  const seen = new Set<string>();
  const merged: NewsArticle[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const batch = await fetchFromNewsApi(apiKey, query, page);
    for (const article of batch) {
      if (seen.has(article.id)) continue;
      seen.add(article.id);
      merged.push(article);
    }
    if (batch.length < NEWS_PAGE_SIZE) break;
  }

  return merged;
}

/**
 * Marketaux is finance-news-only by design, so unlike NewsAPI's "everything"
 * endpoint it doesn't need the include/exclude keyword filtering above —
 * that machinery stays in place purely as a fallback for when only
 * NEWS_API_KEY is configured (no Marketaux key yet, or Marketaux fetch
 * failed for this request).
 */
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

/**
 * Merges article pools in priority order (first pool wins on id collisions),
 * deduping and capping the result. Marketaux's Free/Basic plans return only
 * a handful of articles per request (3 on Free), so we always top up with
 * NewsAPI/demo rather than treating a small non-empty Marketaux result as a
 * complete feed.
 */
function mergeArticlePools(pools: NewsArticle[][], cap: number): NewsArticle[] {
  const seen = new Set<string>();
  const merged: NewsArticle[] = [];
  for (const pool of pools) {
    for (const a of pool) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      merged.push(a);
      if (merged.length >= cap) return merged;
    }
  }
  return merged;
}

/**
 * Drops articles without a usable hero image. Applied to Marketaux/NewsAPI
 * pools before merging — those sources frequently omit an image for a given
 * story (the source just never supplied one), and this is a full-screen
 * photo feed, so we'd rather not surface those rather than lean on
 * per-card fallback art for real news.
 *
 */
function withUsableImage(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter((a) => hasUsableFeedImage(a.imageUrl));
}

/**
 * No placeholder/demo content exists in this app anymore — if every real
 * source comes back empty, these functions return an empty array and the
 * UI's existing "No stories match" empty state handles it. We never want
 * to show fabricated stories misattributed to real publishers.
 */
export async function fetchTrendingNewsArticles(): Promise<NewsArticle[]> {
  let marketauxArticles: NewsArticle[] = [];
  if (process.env.MARKETAUX_API_KEY) {
    try {
      marketauxArticles = await fetchTrendingFromMarketaux();
    } catch (err) {
      console.error("[fetchNews] Marketaux trending threw:", err);
    }
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.error("[fetchNews] NEWS_API_KEY is not set — trending feed relies on Marketaux only");
    return mergeArticlePools([withUsableImage(marketauxArticles)], TRENDING_CAP);
  }

  try {
    const newsApiArticles = await fetchPagedNews(apiKey, TRENDING_QUERY, 1);
    return mergeArticlePools(
      [withUsableImage(marketauxArticles), withUsableImage(newsApiArticles)],
      TRENDING_CAP
    );
  } catch (err) {
    console.error("[fetchNews] Trending feed threw:", err);
    return mergeArticlePools([withUsableImage(marketauxArticles)], TRENDING_CAP);
  }
}

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  let marketauxArticles: NewsArticle[] = [];
  if (process.env.MARKETAUX_API_KEY) {
    try {
      marketauxArticles = await fetchMainFeedFromMarketaux();
    } catch (err) {
      console.error("[fetchNews] Marketaux main feed threw:", err);
    }
  }

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    console.error("[fetchNews] NEWS_API_KEY is not set — main feed relies on Marketaux only");
    return filterFinanceArticles(
      mergeArticlePools([withUsableImage(marketauxArticles)], MAIN_FEED_CAP)
    );
  }

  try {
    let newsApiArticles = await fetchPagedNews(apiKey, FINANCE_QUERY);

    if (newsApiArticles.length === 0) {
      const backup = new URL("https://newsapi.org/v2/top-headlines");
      backup.searchParams.set("category", "business");
      backup.searchParams.set("country", "us");
      backup.searchParams.set("pageSize", String(NEWS_PAGE_SIZE));
      backup.searchParams.set("apiKey", apiKey);
      const res = await fetch(backup.toString(), {
        next: { revalidate: 90 },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        newsApiArticles = (data.articles ?? [])
          .filter(
            (a: NewsApiArticle) =>
              a.title && a.title !== "[Removed]" && isFinanceArticle(a)
          )
          .map((a: Parameters<typeof mapNewsApiArticle>[0]) =>
            mapNewsApiArticle(a)
          );
      }
    }

    return filterFinanceArticles(
      mergeArticlePools(
        [withUsableImage(marketauxArticles), withUsableImage(newsApiArticles)],
        MAIN_FEED_CAP
      )
    );
  } catch (err) {
    console.error("[fetchNews] Main feed NewsAPI path threw:", err);
    return filterFinanceArticles(
      mergeArticlePools([withUsableImage(marketauxArticles)], MAIN_FEED_CAP)
    );
  }
}
