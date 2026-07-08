import { computeFinanceRelevanceScore } from "./feedRelevance";
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
  "marketwatch",
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
  "rally",
  "selloff",
] as const;

export function computeTrendingScore(article: NewsArticle): number {
  let score = 0;
  const title = article.headline.toLowerCase();
  const sourceBlob = `${article.sourceName} ${article.sourceId ?? ""} ${article.sourceUrl}`.toLowerCase();

  // Popularity signals
  score += Math.min(article.likes, 500) * 0.35;
  score += Math.min(article.comments, 200) * 0.55;
  score += Math.min(article.shares, 200) * 0.45;

  if (HIGH_AUTHORITY_SOURCES.some((name) => sourceBlob.includes(name))) {
    score += 22;
  }

  for (const keyword of TRENDING_TITLE_KEYWORDS) {
    if (title.includes(keyword)) {
      score += 8;
    }
  }

  const ageMs = Date.now() - new Date(article.publishedAt).getTime();
  const ageHours = ageMs / 3_600_000;
  if (ageHours < 6) {
    score += 24;
  } else if (ageHours < 12) {
    score += 16;
  } else if (ageHours < 24) {
    score += 8;
  }

  score += Math.round(computeFinanceRelevanceScore(article) * 0.45);

  return score;
}

export function rankTrendingArticles(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const scoreDiff = computeTrendingScore(b) - computeTrendingScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    const engagementDiff =
      b.likes + b.comments * 2 + b.shares - (a.likes + a.comments * 2 + a.shares);
    if (engagementDiff !== 0) return engagementDiff;
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
}
