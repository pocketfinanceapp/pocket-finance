import { articleMatchesMarket } from "./filters";
import type { MarketFilter, SectorFilter } from "./filters";
import { computeFinanceRelevanceScore } from "./feedRelevance";
import {
  TOPIC_KEYWORDS,
  loadRecentlyRead,
  type ProfileTopic,
} from "./profileStorage";
import { getActivityEvents } from "./progression";
import type { ExploreCompany } from "./exploreCompanies";
import {
  articleMatchesPreferredRegion,
  marketMatchesPreferredRegion,
  type AppRegionId,
} from "./regionPreferences";
import type { NewsArticle, SavedArticleEntry } from "./types";

function articleMatchesTopics(
  article: NewsArticle,
  topics: ProfileTopic[]
): boolean {
  if (topics.length === 0) return false;
  const text = [
    article.headline,
    article.subheading,
    article.body,
    ...article.tags,
    article.ticker,
    article.sector,
  ]
    .join(" ")
    .toLowerCase();
  return topics.some((topic) =>
    TOPIC_KEYWORDS[topic].some((keyword) => text.includes(keyword))
  );
}

export interface FeedPersonalizationInput {
  followedMarkets: MarketFilter[];
  sectorInterests: SectorFilter[];
  favouriteTopics: ProfileTopic[];
  preferredRegion: AppRegionId | null;
  followedTickers: Set<string>;
  savedTickers: Set<string>;
  engagedTickers: Set<string>;
  recentlyReadTickers: Set<string>;
  likedArticleIds: Set<string>;
  openedArticleIds: Set<string>;
}

interface BuildPersonalizationOptions {
  followedMarkets: MarketFilter[];
  sectorInterests: SectorFilter[];
  favouriteTopics: ProfileTopic[];
  preferredRegion?: AppRegionId | null;
  followedTickers?: string[];
  savedArticles: SavedArticleEntry[];
  articlesById: Map<string, NewsArticle>;
}

export function buildFeedPersonalizationInput(
  opts: BuildPersonalizationOptions
): FeedPersonalizationInput {
  const savedTickers = new Set(
    opts.savedArticles.map((e) => e.ticker.toUpperCase()).filter(Boolean)
  );

  const recentlyReadTickers = new Set<string>();
  for (const entry of loadRecentlyRead()) {
    const article = opts.articlesById.get(entry.id);
    if (article?.ticker) {
      recentlyReadTickers.add(article.ticker.toUpperCase());
    }
  }

  const engagedTickers = new Set<string>();
  const likedArticleIds = new Set<string>();
  const openedArticleIds = new Set<string>();

  for (const event of getActivityEvents()) {
    const articleId = event.metadata?.articleId ?? event.entityId;
    const ticker = event.metadata?.ticker?.toUpperCase();

    if (event.type === "article_opened" && articleId) {
      openedArticleIds.add(articleId);
      const article = opts.articlesById.get(articleId);
      if (article?.ticker) engagedTickers.add(article.ticker.toUpperCase());
    }

    if (event.type === "article_liked" && articleId) {
      likedArticleIds.add(articleId);
      const article = opts.articlesById.get(articleId);
      if (article?.ticker) engagedTickers.add(article.ticker.toUpperCase());
    }

    if (event.type === "article_saved" && articleId) {
      const article = opts.articlesById.get(articleId);
      if (article?.ticker) engagedTickers.add(article.ticker.toUpperCase());
    }

    if (
      (event.type === "stock_panel_opened" ||
        event.type === "stock_watchlisted") &&
      ticker
    ) {
      engagedTickers.add(ticker);
    }
  }

  const followedTickers = new Set(
    (opts.followedTickers ?? []).map((t) => t.toUpperCase())
  );

  return {
    followedMarkets: opts.followedMarkets,
    sectorInterests: opts.sectorInterests,
    favouriteTopics: opts.favouriteTopics,
    preferredRegion: opts.preferredRegion ?? null,
    followedTickers,
    savedTickers,
    engagedTickers,
    recentlyReadTickers,
    likedArticleIds,
    openedArticleIds,
  };
}

export function computeForYouScore(
  article: NewsArticle,
  input: FeedPersonalizationInput
): number {
  let score = computeFinanceRelevanceScore(article) * 0.55;

  const ticker = article.ticker?.trim().toUpperCase() ?? "";

  if (
    input.followedMarkets.some((market) =>
      articleMatchesMarket(article.market, market)
    )
  ) {
    score += 48;
  }

  // Soft home-region nudge — never a hard filter.
  if (
    input.preferredRegion &&
    articleMatchesPreferredRegion(article.market, input.preferredRegion)
  ) {
    score += 22;
  }

  if (
    input.sectorInterests.length > 0 &&
    input.sectorInterests.includes(article.sector as SectorFilter)
  ) {
    score += 42;
  }

  if (
    input.favouriteTopics.length > 0 &&
    articleMatchesTopics(article, input.favouriteTopics)
  ) {
    score += 36;
  }

  if (ticker && input.followedTickers.has(ticker)) score += 65;
  if (ticker && input.savedTickers.has(ticker)) score += 58;
  if (ticker && input.engagedTickers.has(ticker)) score += 38;
  if (ticker && input.recentlyReadTickers.has(ticker)) score += 28;

  if (input.likedArticleIds.has(article.id)) score += 22;
  // Strong push-down for anything already opened — without this,
  // personalization bonuses above (up to +65) keep re-surfacing already-read
  // stories at the top of the feed indefinitely, which is what made reopening
  // the app show the same handful of articles every time.
  if (input.openedArticleIds.has(article.id)) score -= 70;

  // Recency now carries enough weight to compete with personalization
  // bonuses, so genuinely new stories reliably surface above older
  // already-seen ones on reopen, while ties still favour personalized picks.
  const ageHours =
    (Date.now() - new Date(article.publishedAt).getTime()) / 3_600_000;
  if (ageHours < 6) score += 60;
  else if (ageHours < 24) score += 35;
  else if (ageHours < 72) score += 15;
  else {
    // Beyond 3 days, apply a growing penalty on top of getting no bonus.
    // Ticker/sector/topic personalization bonuses can stack past 150+ points
    // for a heavily-followed name, which was enough to keep a 9-day-old
    // story pinned above genuinely fresh articles. This decay scales with
    // staleness so no amount of personalization match can permanently park
    // an old story at the top of the feed.
    const daysStale = (ageHours - 72) / 24;
    score -= Math.min(220, Math.round(daysStale * 22));
  }

  return score;
}

export function rankForYouFeed(
  articles: NewsArticle[],
  input: FeedPersonalizationInput
): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const diff = computeForYouScore(b, input) - computeForYouScore(a, input);
    if (diff !== 0) return diff;
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
}

export function computeCompanyRelevanceScore(
  company: ExploreCompany,
  input: FeedPersonalizationInput
): number {
  let score = 0;
  const ticker = company.ticker.toUpperCase();

  if (input.followedTickers.has(ticker)) score += 140;
  if (input.savedTickers.has(ticker)) score += 120;
  if (input.engagedTickers.has(ticker)) score += 80;
  if (input.recentlyReadTickers.has(ticker)) score += 55;

  if (
    input.sectorInterests.includes(company.meta.sector as SectorFilter)
  ) {
    score += 45;
  }

  if (
    input.followedMarkets.some((market) =>
      articleMatchesMarket(company.meta.market, market)
    )
  ) {
    score += 38;
  }

  if (
    input.preferredRegion &&
    marketMatchesPreferredRegion(company.meta.market, input.preferredRegion)
  ) {
    score += 18;
  }

  if (
    input.favouriteTopics.length > 0 &&
    articleMatchesTopics(
      {
        id: ticker,
        headline: company.meta.companyName,
        subheading: "",
        body: "",
        imageUrl: "",
        market: company.meta.market,
        sector: company.meta.sector,
        ticker,
        companyName: company.meta.companyName,
        tags: company.meta.tags,
        publishedAt: new Date().toISOString(),
        sourceName: "",
        sourceUrl: "",
        likes: 0,
        comments: 0,
        shares: 0,
      },
      input.favouriteTopics
    )
  ) {
    score += 30;
  }

  return score;
}

export function rankExploreCompanies(
  companies: ExploreCompany[],
  input: FeedPersonalizationInput
): ExploreCompany[] {
  const hasSignals =
    input.followedMarkets.length > 0 ||
    input.sectorInterests.length > 0 ||
    input.favouriteTopics.length > 0 ||
    Boolean(input.preferredRegion) ||
    input.followedTickers.size > 0 ||
    input.savedTickers.size > 0 ||
    input.engagedTickers.size > 0 ||
    input.recentlyReadTickers.size > 0;

  // Preserve catalog order (already most-relevant-first) when the user has no prefs.
  if (!hasSignals) return companies;

  // Catalog index is the popularity baseline — prefer it over A–Z when scores tie.
  const catalogIndex = new Map(
    companies.map((company, index) => [company.ticker.toUpperCase(), index])
  );

  return [...companies].sort((a, b) => {
    const diff =
      computeCompanyRelevanceScore(b, input) -
      computeCompanyRelevanceScore(a, input);
    if (diff !== 0) return diff;
    return (
      (catalogIndex.get(a.ticker.toUpperCase()) ?? 9999) -
      (catalogIndex.get(b.ticker.toUpperCase()) ?? 9999)
    );
  });
}
