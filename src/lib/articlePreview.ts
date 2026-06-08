import type { NewsArticle } from "./types";

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Body preview text that adds info beyond the subheading */
export function getArticleBodyPreview(article: NewsArticle): string | null {
  const subheading = article.subheading?.trim() ?? "";
  const subNorm = normalize(subheading);

  const paragraphs = article.body
    .split(/\n\n+/)
    .map((p) => p.trim())
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
