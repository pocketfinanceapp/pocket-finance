import type { NewsArticle } from "./types";

export function getFinanceScore(article: NewsArticle): number {
  const text = `${article.headline} ${article.subheading}`.toLowerCase();

  const hardNoiseTerms = [
    "best deals",
    "shop now",
    "prime day",
    "standout deals",
    "discount code",
    "coupon",
    "gift guide",
    "sale ends",
    "promo code",
    "walmart deals",
    "amazon deals",
    "limited time offer",
  ];

  const hasHardNoise = hardNoiseTerms.some((t) => text.includes(t));

  let score = 0;

  const strongSignals = [
    "earnings",
    "revenue",
    "profit",
    "loss",
    "ipo",
    "acquisition",
    "merger",
    "interest rate",
    "federal reserve",
    "inflation",
    "gdp",
    "shares",
    "nasdaq",
    "nyse",
    "asx",
    "bitcoin",
    "crypto",
    "bond yield",
    "commodity",
    "hedge fund",
    "dividend",
    "buyback",
    "quarterly results",
    "fiscal",
    "funding round",
    "valuation",
  ];

  const weakSignals = [
    "stock",
    "market",
    "investor",
    "analyst",
    "forecast",
    "outlook",
    "economy",
  ];

  strongSignals.forEach((t) => {
    if (text.includes(t)) score += 3;
  });
  weakSignals.forEach((t) => {
    if (text.includes(t)) score += 1;
  });

  if (hasHardNoise && score < 5) return 0;
  return score;
}

export function filterFinanceArticles(articles: NewsArticle[]): NewsArticle[] {
  return articles.filter((article) => getFinanceScore(article) >= 1);
}
