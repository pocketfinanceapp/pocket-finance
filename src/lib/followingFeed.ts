import type { MarketFilter, SectorFilter } from "./filters";
import { articleMatchesMarket } from "./filters";
import { articleMatchesTopics } from "./filterArticles";
import type { ProfileTopic } from "./profileStorage";
import type { NewsArticle, SavedArticleEntry } from "./types";

function articleMatchesFollowedTicker(
  article: NewsArticle,
  tickers: Set<string>
): boolean {
  if (tickers.size === 0) return false;
  const upper = article.ticker.toUpperCase();
  if (tickers.has(upper)) return true;
  return article.tags.some((tag) => tickers.has(tag.toUpperCase()));
}

export function buildFollowingArticles(
  articles: NewsArticle[],
  followedMarkets: MarketFilter[],
  sectorInterests: SectorFilter[],
  favouriteTopics: ProfileTopic[],
  savedArticles: SavedArticleEntry[]
): NewsArticle[] {
  const followedTickers = new Set(
    savedArticles.map((entry) => entry.ticker.toUpperCase())
  );

  const hasAnyFollow =
    followedMarkets.length > 0 ||
    sectorInterests.length > 0 ||
    favouriteTopics.length > 0 ||
    followedTickers.size > 0;

  if (!hasAnyFollow) return [];

  return articles.filter((article) => {
    if (
      followedMarkets.some((market) => articleMatchesMarket(article.market, market))
    ) {
      return true;
    }
    if (sectorInterests.includes(article.sector)) return true;
    if (articleMatchesTopics(article, favouriteTopics)) return true;
    if (articleMatchesFollowedTicker(article, followedTickers)) return true;
    return false;
  });
}
