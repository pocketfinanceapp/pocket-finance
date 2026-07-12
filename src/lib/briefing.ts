import type { NewsArticle } from "./types";
import { getArticleSubheading } from "./articlePreview";

export interface BriefingSection {
  title: string;
  paragraphs: string[];
}

export interface PocketBriefing {
  lede: string;
  sections: BriefingSection[];
  takeaway: string;
}

const BRIEFING_CACHE_KEY = "pf_briefings_v3";
const MAX_BODY_CHARS = 2400;

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanParagraph(text: string): string {
  return stripHtml(text).trim();
}

/** Collect readable source text for briefing generation */
export function getBriefingSourceText(article: NewsArticle): string {
  const parts: string[] = [];
  const subheading = getArticleSubheading(article.subheading);
  if (subheading) parts.push(subheading);

  const bodyParagraphs = article.body
    .split(/\n\n+/)
    .map(cleanParagraph)
    .filter((p) => p.length >= 30);

  for (const paragraph of bodyParagraphs) {
    if (subheading && paragraph === subheading) continue;
    parts.push(paragraph);
  }

  const combined = parts.join("\n\n");
  if (combined.length <= MAX_BODY_CHARS) return combined;
  return `${combined.slice(0, MAX_BODY_CHARS).trim()}…`;
}

export function buildBriefingRequestPayload(article: NewsArticle) {
  return {
    headline: article.headline,
    sourceText: getBriefingSourceText(article),
    ticker: article.ticker,
    companyName: article.companyName,
    market: article.market,
    sector: article.sector,
    tags: article.tags,
    sourceName: article.sourceName,
  };
}

function isValidBriefing(value: unknown): value is PocketBriefing {
  if (!value || typeof value !== "object") return false;
  const briefing = value as PocketBriefing;
  if (typeof briefing.lede !== "string" || !briefing.lede.trim()) return false;
  if (typeof briefing.takeaway !== "string" || !briefing.takeaway.trim()) {
    return false;
  }
  if (!Array.isArray(briefing.sections) || briefing.sections.length === 0) {
    return false;
  }
  return briefing.sections.every(
    (section) =>
      typeof section.title === "string" &&
      section.title.trim() &&
      Array.isArray(section.paragraphs) &&
      section.paragraphs.some((p) => typeof p === "string" && p.trim())
  );
}

export function parseBriefingResponse(text: string): PocketBriefing | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.unshift(fenced[1].trim());

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    candidates.push(trimmed.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isValidBriefing(parsed)) {
        return {
          lede: parsed.lede.trim(),
          takeaway: parsed.takeaway.trim(),
          sections: parsed.sections
            .map((section) => ({
              title: section.title.trim(),
              paragraphs: section.paragraphs
                .map((p) => p.trim())
                .filter(Boolean),
            }))
            .filter((section) => section.paragraphs.length > 0),
        };
      }
    } catch {
      /* try next candidate */
    }
  }

  return null;
}

type BriefingCache = Record<string, PocketBriefing>;

function readCache(): BriefingCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BRIEFING_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BriefingCache;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function loadCachedBriefing(articleId: string): PocketBriefing | null {
  const cached = readCache()[articleId];
  return isValidBriefing(cached) ? cached : null;
}

export function saveCachedBriefing(
  articleId: string,
  briefing: PocketBriefing
): void {
  if (typeof window === "undefined" || !isValidBriefing(briefing)) return;
  try {
    const cache = readCache();
    cache[articleId] = briefing;
    const ids = Object.keys(cache);
    if (ids.length > 80) {
      for (const id of ids.slice(0, ids.length - 80)) {
        delete cache[id];
      }
    }
    window.localStorage.setItem(BRIEFING_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota errors */
  }
}

/** Offline fallback when the API is unavailable */
export function buildFallbackBriefing(article: NewsArticle): PocketBriefing {
  const sourceText = getBriefingSourceText(article);
  const paragraphs = sourceText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const lede =
    paragraphs[0] ??
    `${article.companyName} (${article.ticker}) is in focus after developments tied to ${article.headline.toLowerCase()}.`;

  const detailParagraphs =
    paragraphs.length > 1
      ? paragraphs.slice(1)
      : [
          `${article.companyName} trades on ${article.market} within the ${article.sector} sector. Investors are weighing how this story could influence positioning, sentiment, and near-term price action.`,
          `Coverage from ${article.sourceName} highlights the core development, but the full implications may take additional reporting to clarify.`,
        ];

  return {
    lede,
    sections: [
      {
        title: "What happened",
        paragraphs: [detailParagraphs[0] ?? lede],
      },
      {
        title: "Why it matters",
        paragraphs: [
          `For ${article.ticker} holders, this ties into ${article.sector.toLowerCase()} sector sentiment and how the ${article.market} tape is pricing the news.`,
        ],
      },
    ],
    takeaway: `Watch whether this shifts the near-term outlook for ${article.ticker}.`,
  };
}
