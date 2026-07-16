import { NEWS_API_BLOCKED_TERMS } from "./articleFilter";
import { isExcludedArticle } from "./articleText";
import { filterFinanceArticles } from "./financeRelevance";
import { mapNewsApiArticle, mapMarketauxArticle, DEMO_ARTICLES } from "./newsMapper";
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
  url.searchParams.set("_cb", String(Date.now()));

  const res = await fetch(url.toString(), {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

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

export async function fetchTrendingNewsArticles(): Promise<NewsArticle[]> {
  if (process.env.MARKETAUX_API_KEY) {
    try {
      const articles = await fetchTrendingFromMarketaux();
      if (articles.length > 0) return articles.slice(0, TRENDING_CAP);
    } catch {
      // fall through to NewsAPI/demo below
    }
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return DEMO_ARTICLES.slice(0, 10);
  }

  try {
    const articles = await fetchPagedNews(apiKey, TRENDING_QUERY, 1);
    if (articles.length === 0) return [];
    return articles.slice(0, TRENDING_CAP);
  } catch {
    return [];
  }
}

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  if (process.env.MARKETAUX_API_KEY) {
    try {
      const articles = await fetchMainFeedFromMarketaux();
      if (articles.length > 0) return articles;
    } catch {
      // fall through to NewsAPI/demo below
    }
  }

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return filterFinanceArticles(DEMO_ARTICLES);
  }

  try {
    let articles = await fetchPagedNews(apiKey, FINANCE_QUERY);

    if (articles.length === 0) {
      const backup = new URL("https://newsapi.org/v2/top-headlines");
      backup.searchParams.set("category", "business");
      backup.searchParams.set("country", "us");
      backup.searchParams.set("pageSize", String(NEWS_PAGE_SIZE));
      backup.searchParams.set("apiKey", apiKey);
      backup.searchParams.set("_cb", String(Date.now()));
      const res = await fetch(backup.toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        articles = (data.articles ?? [])
          .filter(
            (a: NewsApiArticle) =>
              a.title && a.title !== "[Removed]" && isFinanceArticle(a)
          )
          .map((a: Parameters<typeof mapNewsApiArticle>[0]) =>
            mapNewsApiArticle(a)
          );
      }
    }

    return filterFinanceArticles(mergeWithDemo(articles));
  } catch {
    return filterFinanceArticles(DEMO_ARTICLES);
  }
}

function mergeWithDemo(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const merged: NewsArticle[] = [];
  for (const a of [...articles, ...DEMO_ARTICLES]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    merged.push(a);
    if (merged.length >= MAIN_FEED_CAP) break;
  }
  return merged;
}
