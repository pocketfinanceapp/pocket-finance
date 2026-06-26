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
  "chart",
  "graph",
  "candlestick",
  "stock-chart",
  "market-chart",
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
