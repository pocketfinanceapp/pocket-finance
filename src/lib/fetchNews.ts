import { NEWS_API_BLOCKED_TERMS } from "./articleFilter";
import { isExcludedArticle } from "./articleText";
import { mapNewsApiArticle, DEMO_ARTICLES } from "./newsMapper";
import type { NewsArticle } from "./types";

const FINANCE_QUERY =
  "stocks OR markets OR earnings OR Fed OR investing OR shares OR NYSE OR NASDAQ OR ASX OR economy OR finance OR trading OR crypto OR bitcoin";

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

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return DEMO_ARTICLES;
  }

  try {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set(
      "q",
      `${FINANCE_QUERY} NOT (${EXCLUDED_QUERY})`
    );
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "30");
    url.searchParams.set("apiKey", apiKey);
    url.searchParams.set("_cb", String(Date.now()));

    let res = await fetch(url.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const backup = new URL("https://newsapi.org/v2/top-headlines");
      backup.searchParams.set("category", "business");
      backup.searchParams.set("country", "us");
      backup.searchParams.set("pageSize", "30");
      backup.searchParams.set("apiKey", apiKey);
      backup.searchParams.set("_cb", String(Date.now()));
      res = await fetch(backup.toString(), {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
    }

    if (!res.ok) return mergeWithDemo([]);

    const data = await res.json();
    const articles = (data.articles ?? [])
      .filter(
        (a: NewsApiArticle) =>
          a.title && a.title !== "[Removed]" && isFinanceArticle(a)
      )
      .map((a: Parameters<typeof mapNewsApiArticle>[0], i: number) =>
        mapNewsApiArticle(a, i)
      );

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
