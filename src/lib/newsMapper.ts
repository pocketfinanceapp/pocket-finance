import type { NewsArticle } from "./types";
import { hasUsableFeedImage } from "./feedImage";
import { cleanArticleDescription } from "./articleText";
import { cleanArticleTitle } from "./sourceBranding";
import {
  findCatalogTickerNamedInTitle,
  getTickerMetaBySymbol,
  inferCountryFromHeadline,
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
  const titleLower = title.toLowerCase();

  // Word-boundary match on the symbol, not a bare substring check — a
  // naive titleLower.includes("c") would "find" the single-letter ticker C
  // inside any word containing the letter c (e.g. "crude"), which made
  // short tickers (C, T, F...) always look "named in the title" even when
  // they weren't actually mentioned.
  function isNamedInTitle(entity: { name: string; symbol: string }): boolean {
    const nameLower = (entity.name || "").toLowerCase().trim();
    if (nameLower && titleLower.includes(nameLower)) return true;
    const symbolLower = (entity.symbol || "").toLowerCase().trim();
    if (!symbolLower) return false;
    const escaped = symbolLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(titleLower);
  }

  const topEntity =
    raw.entities.length > 0
      ? [...raw.entities].sort((a, b) => b.matchScore - a.matchScore)[0]
      : null;

  // Marketaux picks one top-scored entity per article, but that can still
  // be a passing mention (a quoted analyst's employer, a competitor
  // comparison) rather than the story's actual subject — even when it's
  // the *only* entity Marketaux extracted, so there's nothing to outrank
  // it in a relative comparison (e.g. a Ryanair incident story that
  // extracted only "Alaska Air" as an entity, or a "Kraken expands
  // tokenized stocks" story whose top entity was Robinhood). The most
  // reliable signal available is whether the headline itself actually
  // names the company/ticker — real subject-of-the-story headlines almost
  // always do ("Kraken Expands...", "...(NYSE:ALK)"), passing mentions
  // almost never do. When Marketaux extracted multiple entities and one of
  // the *other* ones is the one actually named in the headline, prefer it
  // over the nominally higher-scored one.
  const namedEntities = raw.entities.filter(isNamedInTitle);
  const headlineConfirmedEntity =
    namedEntities.length > 0
      ? [...namedEntities].sort((a, b) => b.matchScore - a.matchScore)[0]
      : null;

  // Fallback when nothing in the headline matches any extracted entity
  // (e.g. a "markets wrap" story with no single named company) — the
  // top-scored entity is still the best guess, but stays subject to two
  // guards: a macro/commodity theme only mentioned in passing (e.g.
  // "...Oil declined." dragging an unrelated story into "Crude Oil"), and
  // a headline that carries a strong, unambiguous foreign-market signal
  // ("Nifty", "rupee", "Hang Seng"...) that the entity's own country
  // contradicts.
  const macroCheckedFallback =
    topEntity &&
    isMacroOrCommodityTicker(topEntity.symbol) &&
    !macroThemeConfirmedByTitle(topEntity.symbol, title)
      ? null
      : topEntity;

  const headlineCountry = inferCountryFromHeadline(title);
  const fallbackMismatchesHeadlineCountry =
    macroCheckedFallback !== null &&
    headlineCountry !== null &&
    macroCheckedFallback.country?.toLowerCase() !== headlineCountry;

  // Marketaux's fallback entity is itself unconfirmed by the headline text
  // (that's why we got here — headlineConfirmedEntity was null). If our own
  // hand-maintained catalog independently recognizes a *different* company
  // that genuinely IS named in the headline, trust that over Marketaux's
  // unconfirmed pick. This catches cases where Marketaux extracted only one
  // (wrong) entity for a story — nothing to relatively outrank it — e.g. an
  // "AT&T Shares Jump" earnings story where Marketaux's sole extracted
  // entity was an unrelated passing mention of EchoStar (SATS).
  const catalogHeadlineMatch =
    headlineConfirmedEntity || !macroCheckedFallback
      ? null
      : findCatalogTickerNamedInTitle(title);
  const catalogDisagreesWithFallback =
    catalogHeadlineMatch !== null &&
    catalogHeadlineMatch.ticker !== macroCheckedFallback?.symbol;

  const bestEntity =
    headlineConfirmedEntity ??
    (fallbackMismatchesHeadlineCountry || catalogDisagreesWithFallback
      ? null
      : macroCheckedFallback);

  // Keep our own curated market/sector/tags for symbols we recognize, but
  // prefer Marketaux's live company name over our generic ticker-as-name
  // fallback for symbols outside our catalog.
  const meta = bestEntity
    ? {
        ...getTickerMetaBySymbol(bestEntity.symbol, bestEntity.industry, bestEntity.name),
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
      headline: title,
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
