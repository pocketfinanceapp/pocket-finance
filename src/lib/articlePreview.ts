import type { NewsArticle } from "./types";

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

function normalize(text: string): string {
  return stripHtml(text).toLowerCase();
}

const PAYWALL_PHRASES = [
  "cancel anytime",
  "during your trial",
  "subscribe to",
  "subscription",
  "free trial",
  "per month",
  "per year",
  "sign up",
  "register to read",
  "already a subscriber",
  "$75",
  "digital access",
  "complete digital access",
  "subscribe to read",
  "subscription required",
  "subscriber-only",
  "premium subscriber",
  "sign up for a subscription",
  "then $",
  "unlimited digital access",
  "ft.com/subscription",
  "save now on",
] as const;

function isPaywallText(text: string): boolean {
  const lower = text.toLowerCase();
  return PAYWALL_PHRASES.some((phrase) => lower.includes(phrase));
}

function stripPaywallText(text: string): string {
  const cleaned = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !isPaywallText(sentence))
    .join(" ")
    .trim();
  return cleaned.length >= 30 ? cleaned : "";
}

function cleanPreviewText(text: string): string {
  const stripped = stripPaywallText(stripHtml(text));
  if (!stripped || isPaywallText(stripped)) return "";
  return stripped;
}

/** Subheading safe for feed cards and article view — strips paywall promo text */
export function getArticleSubheading(subheading: string | undefined | null): string {
  return cleanPreviewText(subheading?.trim() ?? "");
}

const CONTEXT_MAX_CHARS = 118;

function truncateContext(text: string, max = CONTEXT_MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.55 ? cut.slice(0, lastSpace) : cut;
  return `${base.trim()}…`;
}

/**
 * One-line "why it matters" copy for feed cards — uses existing article
 * description/summary only (no AI generation).
 */
export function getArticleContextLine(article: NewsArticle): string {
  const subheading = getArticleSubheading(article.subheading);
  if (subheading) return truncateContext(subheading);

  const body = getArticleBodyPreview(article);
  if (body) return truncateContext(body);

  return "";
}

/** Body preview text that adds info beyond the subheading */
export function getArticleBodyPreview(article: NewsArticle): string | null {
  const subheading = cleanPreviewText(article.subheading?.trim() ?? "");
  const subNorm = normalize(subheading);

  const paragraphs = article.body
    .split(/\n\n+/)
    .map((p) => cleanPreviewText(p))
    .filter(Boolean);

  for (const para of paragraphs) {
    const paraNorm = normalize(para);
    if (!paraNorm || isPaywallText(para)) continue;

    if (subNorm && paraNorm === subNorm) continue;

    if (subNorm && paraNorm.startsWith(subNorm)) {
      const remainder = cleanPreviewText(
        para
          .slice(subheading.length)
          .trim()
          .replace(/^[.,:;\-\s]+/, "")
      );
      if (remainder.length >= 30) return remainder;
      continue;
    }

    if (
      subNorm &&
      subNorm.length > 24 &&
      paraNorm.includes(subNorm) &&
      para.length <= subheading.length + 60
    ) {
      continue;
    }

    return para;
  }

  return null;
}
