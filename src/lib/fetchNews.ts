import { NEWS_API_BLOCKED_TERMS } from "./articleFilter";
import { isExcludedArticle } from "./articleText";
import { mapNewsApiArticle, DEMO_ARTICLES } from "./newsMapper";
import type { NewsArticle } from "./types";

const FINANCE_QUERY =
  "stocks OR markets OR earnings OR Fed OR investing OR shares OR NYSE OR NASDAQ OR ASX OR economy OR finance OR trading OR crypto OR bitcoin";

const TRENDING_QUERY =
  "market crash OR market surge OR earnings beat OR earnings miss OR Federal Reserve OR interest rate OR inflation OR IPO OR merger OR acquisition OR record high OR record low";

const EXCLUDED_QUERY =
  `accident OR accidents OR crime OR sports OR entertainment OR weather OR NFL OR NBA OR MLB OR NHL OR FIFA OR soccer OR football OR basketball OR baseball OR hockey OR tennis OR golf OR Olympics OR quarterback OR touchdown OR MVP OR playoff OR championship OR military OR troops OR war OR missile OR earthquake OR hurricane OR shooting OR gov.uk OR researchbuzz OR buzzfeed OR gizmodo OR mashable OR mlive OR huffpost OR dailymail OR tmz OR eonline OR usmagazine OR entertainment.yahoo OR "Yahoo Entertainment" OR ${NEWS_API_BLOCKED_TERMS}`;

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
  idOffset: number
): Promise<NewsArticle[]> {
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", `${query} NOT (${EXCLUDED_QUERY})`);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "30");
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
    .map((a: Parameters<typeof mapNewsApiArticle>[0], i: number) =>
      mapNewsApiArticle(a, idOffset + i)
    );
}

export async function fetchTrendingNewsArticles(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return DEMO_ARTICLES.slice(0, 10);
  }

  try {
    const articles = await fetchFromNewsApi(apiKey, TRENDING_QUERY, 10_000);
    if (articles.length === 0) return [];
    return articles.slice(0, 20);
  } catch {
    return [];
  }
}

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return DEMO_ARTICLES;
  }

  try {
    let articles = await fetchFromNewsApi(apiKey, FINANCE_QUERY, 0);

    if (articles.length === 0) {
      const backup = new URL("https://newsapi.org/v2/top-headlines");
      backup.searchParams.set("category", "business");
      backup.searchParams.set("country", "us");
      backup.searchParams.set("pageSize", "30");
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
          .map((a: Parameters<typeof mapNewsApiArticle>[0], i: number) =>
            mapNewsApiArticle(a, i)
          );
      }
    }

    return mergeWithDemo(articles);
  } catch {
    return DEMO_ARTICLES;
  }
}

function mergeWithDemo(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const merged: NewsArticle[] = [];
  for (const a of [...articles, ...DEMO_ARTICLES]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    merged.push(a);
    if (merged.length >= 20) break;
  }
  return merged;
}
