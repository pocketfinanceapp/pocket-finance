/**
 * Live financial news from Marketaux (https://www.marketaux.com).
 *
 * Unlike NewsAPI's general "everything" endpoint, Marketaux's /news/all is
 * purpose-built for finance news and already identifies the company/ticker
 * entities mentioned in each article — no need to guess the ticker from the
 * headline text the way we did for NewsAPI.
 *
 * QUOTA NOTE: the Free plan is 100 requests/day. We cache responses for 30
 * minutes via Next.js's fetch cache, which caps us at ~96 requests/day even
 * under constant traffic (two feeds × 48 refreshes/day) — comfortably under
 * the daily limit.
 */

export interface MarketauxEntity {
  symbol: string;
  name: string;
  exchange: string | null;
  country: string | null;
  type: string | null;
  industry: string | null;
  matchScore: number;
  sentimentScore: number;
}

export interface MarketauxArticle {
  uuid: string;
  title: string;
  description: string;
  snippet: string;
  url: string;
  imageUrl: string | null;
  language: string;
  publishedAt: string;
  source: string;
  entities: MarketauxEntity[];
}

interface RawMarketauxEntity {
  symbol?: string;
  name?: string;
  exchange?: string | null;
  country?: string | null;
  type?: string | null;
  industry?: string | null;
  match_score?: number;
  sentiment_score?: number;
}

interface RawMarketauxArticle {
  uuid?: string;
  title?: string;
  description?: string | null;
  snippet?: string | null;
  url?: string;
  image_url?: string | null;
  language?: string;
  published_at?: string;
  source?: string;
  entities?: RawMarketauxEntity[];
}

interface RawMarketauxResponse {
  meta?: { found?: number; returned?: number; limit?: number; page?: number };
  data?: RawMarketauxArticle[];
  error?: { code?: string; message?: string };
}

function mapEntity(raw: RawMarketauxEntity): MarketauxEntity | null {
  if (!raw.symbol) return null;
  return {
    symbol: raw.symbol,
    name: raw.name ?? raw.symbol,
    exchange: raw.exchange ?? null,
    country: raw.country ?? null,
    type: raw.type ?? null,
    industry: raw.industry ?? null,
    matchScore: typeof raw.match_score === "number" ? raw.match_score : 0,
    sentimentScore:
      typeof raw.sentiment_score === "number" ? raw.sentiment_score : 0,
  };
}

function mapArticle(raw: RawMarketauxArticle): MarketauxArticle | null {
  if (!raw.uuid || !raw.title || !raw.url) return null;
  return {
    uuid: raw.uuid,
    title: raw.title,
    description: raw.description ?? "",
    snippet: raw.snippet ?? "",
    url: raw.url,
    imageUrl: raw.image_url ?? null,
    language: raw.language ?? "en",
    publishedAt: raw.published_at ?? new Date().toISOString(),
    source: raw.source ?? "",
    entities: (raw.entities ?? [])
      .map(mapEntity)
      .filter((e): e is MarketauxEntity => e !== null),
  };
}

interface FetchMarketauxNewsOptions {
  /** Only return articles with at least one identified company/ticker entity. */
  mustHaveEntities?: boolean;
  /** Sort order — defaults to newest first. */
  sort?: "published_at" | "entity_match_score" | "entity_sentiment_score";
  /** Specific tickers to filter to (used for per-stock news tabs). */
  symbols?: string[];
}

export async function fetchMarketauxNews(
  options: FetchMarketauxNewsOptions = {}
): Promise<MarketauxArticle[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.marketaux.com/v1/news/all");
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("language", "en");
  url.searchParams.set("filter_entities", "true");
  if (options.mustHaveEntities) {
    url.searchParams.set("must_have_entities", "true");
  }
  if (options.sort) {
    url.searchParams.set("sort", options.sort);
  }
  if (options.symbols?.length) {
    url.searchParams.set("symbols", options.symbols.join(","));
  }

  try {
    const res = await fetch(url.toString(), {
      // Protects the 100-requests/day free-tier quota — see file header.
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[marketaux] HTTP ${res.status} ${res.statusText}: ${body.slice(0, 500)}`
      );
      return [];
    }

    const data = (await res.json()) as RawMarketauxResponse;
    if (data.error) {
      console.error(
        `[marketaux] API error: ${data.error.code ?? "?"} ${data.error.message ?? ""}`
      );
      return [];
    }

    const mapped = (data.data ?? [])
      .map(mapArticle)
      .filter((a): a is MarketauxArticle => a !== null);

    console.log(
      `[marketaux] fetched ${mapped.length} articles (found: ${data.meta?.found ?? "?"})`
    );

    return mapped;
  } catch (err) {
    console.error("[marketaux] fetch threw:", err);
    return [];
  }
}

/**
 * Real trending entities from Marketaux's own trending endpoint — a
 * relevance-weighted ranking across their full article volume, not just
 * whatever happens to be in our locally cached feed pool.
 */
export interface MarketauxTrendingEntity {
  symbol: string;
  totalDocuments: number;
  sentimentAvg: number | null;
  score: number | null;
}

interface RawTrendingEntity {
  key?: string;
  total_documents?: number;
  sentiment_avg?: number | null;
  score?: number | null;
}

interface RawTrendingResponse {
  meta?: { returned?: number; limit?: number };
  data?: RawTrendingEntity[];
  error?: { code?: string; message?: string };
}

export async function fetchTrendingEntities(
  options: { limit?: number; minDocCount?: number } = {}
): Promise<MarketauxTrendingEntity[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.marketaux.com/v1/entity/trending/aggregation");
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("group_by", "symbol");
  url.searchParams.set("entity_types", "equity,index,etf,cryptocurrency");
  if (options.minDocCount) {
    url.searchParams.set("min_doc_count", String(options.minDocCount));
  }
  if (options.limit) {
    url.searchParams.set("limit", String(options.limit));
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[marketaux] trending HTTP ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as RawTrendingResponse;
    if (data.error) {
      console.error(
        `[marketaux] trending API error: ${data.error.code ?? "?"} ${data.error.message ?? ""}`
      );
      return [];
    }

    return (data.data ?? [])
      .filter((e): e is RawTrendingEntity & { key: string } => Boolean(e.key))
      .map((e) => ({
        symbol: e.key,
        totalDocuments: e.total_documents ?? 0,
        sentimentAvg:
          typeof e.sentiment_avg === "number" ? e.sentiment_avg : null,
        score: typeof e.score === "number" ? e.score : null,
      }));
  } catch (err) {
    console.error("[marketaux] trending fetch threw:", err);
    return [];
  }
}

/**
 * Real country coverage from Marketaux's trending endpoint, grouped by the
 * exchange country of identified entities — powers "Browse by region" with
 * actual current coverage instead of a fixed curated exchange list.
 */
export interface MarketauxTrendingCountry {
  countryCode: string;
  totalDocuments: number;
  sentimentAvg: number | null;
  score: number | null;
}

export async function fetchTrendingCountries(
  options: { limit?: number; minDocCount?: number } = {}
): Promise<MarketauxTrendingCountry[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://api.marketaux.com/v1/entity/trending/aggregation");
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("group_by", "country");
  if (options.minDocCount) {
    url.searchParams.set("min_doc_count", String(options.minDocCount));
  }
  if (options.limit) {
    url.searchParams.set("limit", String(options.limit));
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(
        `[marketaux] trending countries HTTP ${res.status} ${res.statusText}`
      );
      return [];
    }

    const data = (await res.json()) as RawTrendingResponse;
    if (data.error) {
      console.error(
        `[marketaux] trending countries API error: ${data.error.code ?? "?"} ${data.error.message ?? ""}`
      );
      return [];
    }

    return (data.data ?? [])
      .filter(
        (e): e is RawTrendingEntity & { key: string } =>
          Boolean(e.key) && e.key !== "global"
      )
      .map((e) => ({
        countryCode: e.key.toLowerCase(),
        totalDocuments: e.total_documents ?? 0,
        sentimentAvg:
          typeof e.sentiment_avg === "number" ? e.sentiment_avg : null,
        score: typeof e.score === "number" ? e.score : null,
      }));
  } catch (err) {
    console.error("[marketaux] trending countries fetch threw:", err);
    return [];
  }
}

/**
 * Day-by-day sentiment history for a single entity — powers the sentiment
 * trend chart on a ticker's detail page. This is a "market mood over time"
 * chart derived from news coverage, never a price chart.
 */
export interface MarketauxSentimentPoint {
  date: string;
  totalDocuments: number;
  sentimentAvg: number | null;
}

interface RawIntradayGroup {
  key?: string;
  total_documents?: number;
  sentiment_avg?: number | null;
}

interface RawIntradayEntry {
  date?: string;
  data?: RawIntradayGroup[];
}

interface RawIntradayResponse {
  data?: RawIntradayEntry[];
  error?: { code?: string; message?: string };
}

export async function fetchEntitySentimentHistory(
  symbol: string,
  days = 30
): Promise<MarketauxSentimentPoint[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!apiKey || !cleanSymbol) return [];

  const url = new URL("https://api.marketaux.com/v1/entity/stats/intraday");
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("symbols", cleanSymbol);
  url.searchParams.set("interval", "day");
  url.searchParams.set("group_by", "symbol");
  const publishedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  url.searchParams.set("published_after", publishedAfter);
  url.searchParams.set("date_order", "asc");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[marketaux] entity stats HTTP ${res.status} ${res.statusText}`);
      return [];
    }

    const data = (await res.json()) as RawIntradayResponse;
    if (data.error) {
      console.error(
        `[marketaux] entity stats API error: ${data.error.code ?? "?"} ${data.error.message ?? ""}`
      );
      return [];
    }

    const points = (data.data ?? [])
      .map((entry): MarketauxSentimentPoint | null => {
        if (!entry.date) return null;
        const group =
          entry.data?.find((g) => g.key === cleanSymbol) ?? entry.data?.[0];
        return {
          date: entry.date.slice(0, 10),
          totalDocuments: group?.total_documents ?? 0,
          sentimentAvg:
            typeof group?.sentiment_avg === "number" ? group.sentiment_avg : null,
        };
      })
      .filter((p): p is MarketauxSentimentPoint => p !== null);

    return points.sort((a, b) => a.date.localeCompare(b.date));
  } catch (err) {
    console.error("[marketaux] entity stats fetch threw:", err);
    return [];
  }
}

/**
 * Articles similar to a given Marketaux article — powers a "more on this
 * story" carousel at the end of the article detail view.
 */
export async function fetchSimilarArticles(
  uuid: string,
  limit = 6
): Promise<MarketauxArticle[]> {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey || !uuid) return [];

  const url = new URL(
    `https://api.marketaux.com/v1/news/similar/${encodeURIComponent(uuid)}`
  );
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("limit", String(limit));

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`[marketaux] similar HTTP ${res.status} ${res.statusText}`);
      }
      return [];
    }

    const data = (await res.json()) as RawMarketauxResponse;
    if (data.error) {
      console.error(
        `[marketaux] similar API error: ${data.error.code ?? "?"} ${data.error.message ?? ""}`
      );
      return [];
    }

    return (data.data ?? [])
      .map(mapArticle)
      .filter((a): a is MarketauxArticle => a !== null);
  } catch (err) {
    console.error("[marketaux] similar fetch threw:", err);
    return [];
  }
}
