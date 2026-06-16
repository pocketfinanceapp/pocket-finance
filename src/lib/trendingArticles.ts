import { computeFinanceRelevanceScore } from "./feedRelevance";
import { buildFeedArticles } from "./filterArticles";
import type { MarketFilter, SectorFilter } from "./filters";
import type { ProfileTopic } from "./profileStorage";
import type { NewsArticle } from "./types";

const HIGH_AUTHORITY_SOURCES = [
  "cnbc",
  "bloomberg",
  "reuters",
  "wall street journal",
  "wsj",
  "financial times",
  "forbes",
  "business insider",
  "barron",
] as const;

const TRENDING_TITLE_KEYWORDS = [
  "earnings",
  "fed",
  "rate",
  "inflation",
  "crash",
  "surge",
  "plunge",
  "record",
  "billion",
  "ipo",
  "merger",
  "acquisition",
  "tariff",
  "gdp",
  "jobs report",
] as const;

export function computeTrendingScore(
  article: NewsArticle,
  forYouTopIds: Set<string>
): number {
  let score = 0;
  const title = article.headline.toLowerCase();
  const sourceBlob = `${article.sourceName} ${article.sourceId ?? ""} ${article.sourceUrl}`.toLowerCase();

  if (HIGH_AUTHORITY_SOURCES.some((name) => sourceBlob.includes(name))) {
    score += 25;
  }

  for (const keyword of TRENDING_TITLE_KEYWORDS) {
    if (title.includes(keyword)) {
      score += 10;
    }
  }

  const ageMs = Date.now() - new Date(article.publishedAt).getTime();
  const ageHours = ageMs / 3_600_000;
  if (ageHours < 6) {
    score += 20;
  } else if (ageHours < 12) {
    score += 10;
  }

  if (forYouTopIds.has(article.id)) {
    score -= 40;
  }

  score += Math.round(computeFinanceRelevanceScore(article) * 0.35);

  return score;
}

export function rankTrendingArticles(
  articles: NewsArticle[],
  forYouTopIds: Set<string>
): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const scoreDiff =
      computeTrendingScore(b, forYouTopIds) -
      computeTrendingScore(a, forYouTopIds);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
}

export function getForYouTopArticleIds(
  articles: NewsArticle[],
  followedMarkets: MarketFilter[],
  sectorInterests: SectorFilter[],
  favouriteTopics: ProfileTopic[] = []
): Set<string> {
  const forYouList = buildFeedArticles(
    articles,
    "forYou",
    followedMarkets,
    [],
    [],
    sectorInterests,
    "",
    favouriteTopics
  );
  return new Set(forYouList.slice(0, 10).map((article) => article.id));
}
