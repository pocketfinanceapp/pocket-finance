import type { MarketFilter, SectorFilter } from "./filters";
import { articleMatchesMarket } from "./filters";
import type { NewsArticle } from "./types";

export type FeedMode = "forYou" | "following";

export function filterArticles(
  articles: NewsArticle[],
  markets: MarketFilter[],
  sectors: SectorFilter[],
  searchQuery: string
): NewsArticle[] {
  let result = articles;

  if (markets.length > 0) {
    result = result.filter((a) =>
      markets.some((m) => articleMatchesMarket(a.market, m))
    );
  }

  if (sectors.length > 0) {
    result = result.filter((a) => sectors.includes(a.sector));
  }

  const q = searchQuery.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (a) =>
        a.headline.toLowerCase().includes(q) ||
        a.sourceName.toLowerCase().includes(q) ||
        a.subheading.toLowerCase().includes(q) ||
        a.ticker.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.sector.toLowerCase().includes(q)
    );
  }

  return result;
}

/** Stories from followed markets first — does not hide other articles */
export function prioritizeByFollowed(
  articles: NewsArticle[],
  followed: MarketFilter[]
): NewsArticle[] {
  if (followed.length === 0) return articles;

  const priority: NewsArticle[] = [];
  const rest: NewsArticle[] = [];

  for (const article of articles) {
    const isFollowed = followed.some((m) =>
      articleMatchesMarket(article.market, m)
    );
    if (isFollowed) priority.push(article);
    else rest.push(article);
  }

  return [...priority, ...rest];
}

/** Stories matching sector interests first — does not hide other articles */
export function prioritizeBySectors(
  articles: NewsArticle[],
  sectors: SectorFilter[]
): NewsArticle[] {
  if (sectors.length === 0) return articles;

  const priority: NewsArticle[] = [];
  const rest: NewsArticle[] = [];

  for (const article of articles) {
    if (sectors.includes(article.sector)) priority.push(article);
    else rest.push(article);
  }

  return [...priority, ...rest];
}

export function buildFeedArticles(
  articles: NewsArticle[],
  mode: FeedMode,
  followedMarkets: MarketFilter[],
  marketFilters: MarketFilter[],
  sectorFilters: SectorFilter[],
  sectorInterests: SectorFilter[],
  searchQuery: string
): NewsArticle[] {
  if (mode === "following") {
    if (followedMarkets.length === 0) return [];
    return filterArticles(
      articles,
      followedMarkets,
      sectorFilters,
      searchQuery
    );
  }

  // Explicit market drill-down from Markets tab
  if (marketFilters.length > 0) {
    return filterArticles(
      articles,
      marketFilters,
      sectorFilters,
      searchQuery
    );
  }

  // Explicit sector/search filters from Discover
  if (sectorFilters.length > 0 || searchQuery.trim()) {
    let result = filterArticles(articles, [], sectorFilters, searchQuery);
    if (followedMarkets.length > 0) {
      result = prioritizeByFollowed(result, followedMarkets);
    }
    return result;
  }

  // For You: full pool; onboarding interests only affect ranking
  let result = filterArticles(articles, [], [], searchQuery);
  if (followedMarkets.length > 0) {
    result = prioritizeByFollowed(result, followedMarkets);
  }
  if (sectorInterests.length > 0) {
    result = prioritizeBySectors(result, sectorInterests);
  }
  return result;
}
