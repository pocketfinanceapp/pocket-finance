const LOW_QUALITY_URL_PATTERNS = [
  "logo",
  "icon",
  "badge",
  "placeholder",
  "default",
  "blank",
  "gov.uk",
  "gov",
  "headshot",
  "portrait",
  "profile-photo",
  "author",
  "/people/",
  "gettyimages",
] as const;

function urlMatchesBlockedPattern(url: string, pattern: string): boolean {
  const lower = url.toLowerCase();
  if (pattern === "gov") {
    return (
      lower.includes("gov.uk") ||
      /[/_.-]gov[/_.-]/.test(lower) ||
      /[/_.-]gov$/.test(lower) ||
      /^https?:\/\/[^/]*gov\./i.test(lower)
    );
  }
  return lower.includes(pattern);
}

/** URLs that usually resolve to logos, icons, or placeholders */
export function isLowQualityImageUrl(url: string): boolean {
  if (!url.trim()) return true;
  return LOW_QUALITY_URL_PATTERNS.some((pattern) =>
    urlMatchesBlockedPattern(url, pattern)
  );
}

export function hasUsableFeedImage(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  return !isLowQualityImageUrl(url);
}
