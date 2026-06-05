import { mapNewsApiArticle, DEMO_ARTICLES } from "./newsMapper";
import type { NewsArticle } from "./types";

export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return DEMO_ARTICLES;
  }

  try {
    const url = new URL("https://newsapi.org/v2/top-headlines");
    url.searchParams.set("category", "business");
    url.searchParams.set("country", "us");
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("apiKey", apiKey);

    let res = await fetch(url.toString(), { next: { revalidate: 300 } });

    if (!res.ok) {
      const backup = new URL("https://newsapi.org/v2/everything");
      backup.searchParams.set("q", "stock market OR nasdaq OR earnings");
      backup.searchParams.set("language", "en");
      backup.searchParams.set("sortBy", "publishedAt");
      backup.searchParams.set("pageSize", "20");
      backup.searchParams.set("apiKey", apiKey);
      res = await fetch(backup.toString(), { next: { revalidate: 300 } });
    }

    if (!res.ok) return mergeWithDemo([]);

    const data = await res.json();
    const articles = (data.articles ?? [])
      .filter((a: { title?: string }) => a.title && a.title !== "[Removed]")
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
