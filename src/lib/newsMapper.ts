import type { NewsArticle } from "./types";
import { hasUsableFeedImage } from "./feedImage";
import { cleanArticleDescription } from "./articleText";
import { cleanArticleTitle } from "./sourceBranding";
import {
  getTickerMetaBySymbol,
  inferTickerFromFields,
  isMacroOrCommodityTicker,
  macroThemeConfirmedByTitle,
  resolveMarketForArticle,
} from "./tickerMap";
import { hashId, pseudoRandom } from "./utils";
import type { MarketauxArticle } from "./marketauxApi";

/** "reuters.com" -> "Reuters" — light formatting of Marketaux's raw source domain. */
function formatSourceDomain(domain: string): string {
  const label = domain.replace(/^www\./, "").split(".")[0];
  if (!label) return domain;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Marketaux identifies the company/ticker entities mentioned in each
 * article directly (with a match_score), so unlike NewsAPI we don't have to
 * guess the ticker from the headline text — we only fall back to text
 * inference when Marketaux found no entities at all.
 */
export function mapMarketauxArticle(raw: MarketauxArticle): NewsArticle {
  const title = cleanArticleTitle(raw.title);
  const description = cleanArticleDescription(raw.description || raw.snippet || "");

  const topEntity =
    raw.entities.length > 0
      ? [...raw.entities].sort((a, b) => b.matchScore - a.matchScore)[0]
      : null;

  // Marketaux's top-scored entity is usually right, but a "markets wrap"
  // style story can mention a commodity/index only in passing (e.g. "...Oil
  // declined.") and still have that be the single entity Marketaux found —
  // dragging an Asia/chips-selloff story into a "Crude Oil" theme. Only
  // trust a macro/commodity pick when the headline itself supports it.
  const bestEntity =
    topEntity &&
    isMacroOrCommodityTicker(topEntity.symbol) &&
    !macroThemeConfirmedByTitle(topEntity.symbol, title)
      ? null
      : topEntity;

  // Keep our own curated market/sector/tags for symbols we recognize, but
  // prefer Marketaux's live company name over our generic ticker-as-name
  // fallback for symbols outside our catalog.
  const meta = bestEntity
    ? {
        ...getTickerMetaBySymbol(bestEntity.symbol),
        companyName: bestEntity.name || bestEntity.symbol,
      }
    : inferTickerFromFields(title, description);

  const sourceName = raw.source ? formatSourceDomain(raw.source) : "Financial News";
  const id = hashId(raw.uuid || raw.url);
  const entityCountry = bestEntity?.country ? bestEntity.country.toLowerCase() : null;

  return {
    id,
    headline: title,
    subheading: description,
    body:
      raw.snippet ||
      description ||
      `Latest developments shaping ${meta.companyName} and the broader market.`,
    imageUrl: hasUsableFeedImage(raw.imageUrl ?? undefined) ? raw.imageUrl! : "",
    market: resolveMarketForArticle({
      ticker: meta.ticker,
      sourceName,
      sourceId: raw.source || null,
      entityCountry,
    }),
    sector: meta.sector,
    ticker: meta.ticker,
    companyName: meta.companyName,
    tags: meta.tags,
    publishedAt: raw.publishedAt,
    sourceName,
    sourceId: raw.source || null,
    sourceUrl: raw.url,
    likes: 0,
    comments: 0,
    shares: Math.floor(pseudoRandom(id + "shares", 200, 5000)),
    marketauxUuid: raw.uuid || null,
    sentimentScore: bestEntity ? bestEntity.sentimentScore : null,
    entityCountry,
  };
}
