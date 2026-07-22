import type { NewsArticle } from "./types";

/** Shared target ticker count between Explore's "Trending Tickers" strip
 * and Home's "Trending" tab, so both surfaces are built from the same
 * breadth of coverage. */
export const DEFAULT_TRENDING_TICKER_LIMIT = 30;

export interface TrendingTicker {
  ticker: string;
  companyName: string;
  count: number;
  sentimentAvg: number | null;
  articles: NewsArticle[];
}

/**
 * Ranks tickers by mention count across the given article pool, covering
 * every topic/sector currently represented in it (not just whichever
 * tickers happen to also appear on Marketaux's separate global-trending
 * endpoint, which rarely overlaps with our own limited article catalog and
 * previously left "Trending Tickers" showing only one or two results).
 *
 * Shared between ExplorePage's "Trending Tickers" strip and NewsFeed's
 * "Trending" tab so both surfaces agree on what counts as trending, driven
 * by the same underlying article pool.
 */
export function rankTickersByMentions(
  articles: NewsArticle[],
  limit = DEFAULT_TRENDING_TICKER_LIMIT
): TrendingTicker[] {
  const byTicker = new Map<string, NewsArticle[]>();

  for (const article of articles) {
    const ticker = article.ticker?.trim().toUpperCase();
    if (!ticker) continue;
    const list = byTicker.get(ticker);
    if (list) list.push(article);
    else byTicker.set(ticker, [article]);
  }

  const ranked: TrendingTicker[] = [...byTicker.entries()].map(
    ([ticker, arts]) => {
      const sentiments = arts
        .map((a) => a.sentimentScore)
        .filter((s): s is number => typeof s === "number");
      const sentimentAvg =
        sentiments.length > 0
          ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
          : null;

      return {
        ticker,
        companyName: arts[0]?.companyName || ticker,
        count: arts.length,
        sentimentAvg,
        articles: arts,
      };
    }
  );

  return ranked.sort((a, b) => b.count - a.count).slice(0, limit);
}

/**
 * The articles behind the top trending tickers, deduped and sorted by
 * recency — powers the Home "Trending" tab so scrolling it shows coverage
 * of the same trending tickers Explore surfaces, rather than an unrelated
 * engagement-score ranking.
 */
export function articlesForTrendingTickers(
  articles: NewsArticle[],
  limit = DEFAULT_TRENDING_TICKER_LIMIT
): NewsArticle[] {
  const tickers = rankTickersByMentions(articles, limit);
  const seenIds = new Set<string>();
  const result: NewsArticle[] = [];

  for (const t of tickers) {
    for (const article of t.articles) {
      if (seenIds.has(article.id)) continue;
      seenIds.add(article.id);
      result.push(article);
    }
  }

  return result.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
