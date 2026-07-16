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

    if (!res.ok) return [];

    const data = (await res.json()) as RawMarketauxResponse;
    if (data.error) return [];

    return (data.data ?? [])
      .map(mapArticle)
      .filter((a): a is MarketauxArticle => a !== null);
  } catch {
    return [];
  }
}
