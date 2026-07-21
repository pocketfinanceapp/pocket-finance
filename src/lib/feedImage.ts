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
  "avatar",
  "thumbnail",
  "speaker",
  "headline-shot",
  "candlestick",
  "tradingview",
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

/**
 * Earnings/conference call transcripts (common on Seeking Alpha and similar
 * aggregators) never have a real photo — the publisher auto-attaches a
 * generic branded placeholder instead. That placeholder's URL doesn't match
 * any pattern in LOW_QUALITY_URL_PATTERNS (it's a normal-looking image, just
 * not a real one), so it slips past hasUsableFeedImage and gets rendered as
 * if it were a genuine hero photo — the same repeated wordmark graphic on
 * every transcript article. This only affects rendering (which visual to
 * show), not feed inclusion — the article still belongs in the feed, it
 * should just use the category fallback art instead of a fake "real" photo.
 */
const GENERIC_PLACEHOLDER_TITLE_PATTERN =
  /\b(earnings|conference)\s+call\s+transcript\b/i;

/**
 * URL shapes for known sitewide "no real photo" fallback graphics —
 * catches dry filing/report headlines (e.g. "HEXPOL AB (publ) 2026 Q2")
 * that don't match GENERIC_PLACEHOLDER_TITLE_PATTERN above but still get
 * served the publisher's generic social-share image instead of a real
 * photo. Checking the URL shape directly is more reliable than trying to
 * enumerate every dry-headline phrasing that might trigger it.
 */
const GENERIC_PLACEHOLDER_URL_PATTERNS = ["og_image", "og-image", "default-social"];

export function hasRealArticlePhoto(
  url: string | undefined | null,
  headline?: string | null
): boolean {
  if (headline && GENERIC_PLACEHOLDER_TITLE_PATTERN.test(headline)) {
    return false;
  }
  if (
    url &&
    GENERIC_PLACEHOLDER_URL_PATTERNS.some((pattern) =>
      url.toLowerCase().includes(pattern)
    )
  ) {
    return false;
  }
  return hasUsableFeedImage(url);
}

/** Rough luminance check for adaptive feed overlays (best-effort; CORS may block). */
export function estimateImageIsDark(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !src.trim()) {
      resolve(false);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(false);
          return;
        }

        ctx.drawImage(img, 0, 0, 24, 24);
        const { data } = ctx.getImageData(0, 0, 24, 24);
        let luminance = 0;

        for (let i = 0; i < data.length; i += 4) {
          luminance +=
            0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        }

        resolve(luminance / (data.length / 4) < 78);
      } catch {
        resolve(false);
      }
    };

    img.onerror = () => resolve(false);
    img.src = src;
  });
}
