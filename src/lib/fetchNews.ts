import { mapNewsApiArticle, DEMO_ARTICLES } from "./newsMapper";
import type { NewsArticle } from "./types";

const FINANCE_QUERY =
  "stocks OR markets OR earnings OR Fed OR investing OR shares OR NYSE OR NASDAQ OR ASX OR economy OR finance OR trading OR crypto OR bitcoin";

const EXCLUDED_QUERY =
  "accident OR accidents OR crime OR sports OR entertainment OR weather";

const EXCLUDED_TOPIC_RE =
  /\b(accident|accidents|crime|sports?|entertainment|weather|murder|shooting|football|basketball|baseball|soccer|celebrity|concert|storm|hurricane|tornado)\b/i;

interface NewsApiArticle {
  title?: string;
  description?: string | null;
}

function isFinanceArticle(article: NewsApiArticle): boolean {
  const text = `${article.title ?? ""} ${article.description ?? ""}`;
  if (EXCLUDED_TOPIC_RE.test(text)) return false;
  return true;
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

    let res = await fetch(url.toString(), {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const backup = new URL("https://newsapi.org/v2/top-headlines");
      backup.searchParams.set("category", "business");
      backup.searchParams.set("country", "us");
      backup.searchParams.set("pageSize", "30");
      backup.searchParams.set("apiKey", apiKey);
      res = await fetch(backup.toString(), {
        next: { revalidate: 300 },
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
