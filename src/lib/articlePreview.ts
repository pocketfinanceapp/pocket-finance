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

/** Body preview text that adds info beyond the subheading */
export function getArticleBodyPreview(article: NewsArticle): string | null {
  const subheading = stripHtml(article.subheading?.trim() ?? "");
  const subNorm = normalize(subheading);

  const paragraphs = article.body
    .split(/\n\n+/)
    .map((p) => stripHtml(p))
    .filter(Boolean);

  for (const para of paragraphs) {
    const paraNorm = normalize(para);
    if (!paraNorm) continue;

    if (subNorm && paraNorm === subNorm) continue;

    if (subNorm && paraNorm.startsWith(subNorm)) {
      const remainder = para
        .slice(subheading.length)
        .trim()
        .replace(/^[.,:;\-\s]+/, "");
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
