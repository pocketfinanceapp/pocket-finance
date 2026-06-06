const LOW_QUALITY_URL_PATTERNS = [
  "logo",
  "icon",
  "badge",
  "placeholder",
  "default",
  "blank",
  "gov.uk",
  "gov",
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

/** URLs that usually resolve to logos, icons, placeholders, or gov screenshots */
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

function sampleImagePixels(img: HTMLImageElement, size = 48) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0, size, size);
    return ctx.getImageData(0, 0, size, size).data;
  } catch {
    return null;
  }
}

/** Sample loaded image pixels — detects plain white/grey or logo-on-white cards */
export async function isPlainFeedImage(img: HTMLImageElement): Promise<boolean> {
  if (!img.naturalWidth || !img.naturalHeight) return false;

  const data = sampleImagePixels(img);
  if (!data) return false;

  const pixels = 48 * 48;
  let brightPixels = 0;
  let darkPixels = 0;
  let totalBrightness = 0;
  let varianceSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const bright = (r + g + b) / 3;
    totalBrightness += bright;
    if (r > 215 && g > 215 && b > 215) brightPixels += 1;
    if (bright < 85) darkPixels += 1;
  }

  const avg = totalBrightness / pixels;

  for (let i = 0; i < data.length; i += 4) {
    const bright = (data[i] + data[i + 1] + data[i + 2]) / 3;
    varianceSum += (bright - avg) ** 2;
  }

  const variance = varianceSum / pixels;
  const brightRatio = brightPixels / pixels;
  const darkRatio = darkPixels / pixels;

  if (brightRatio > 0.72) return true;
  if (avg > 205 && variance < 500) return true;
  if (avg > 175 && variance < 120) return true;

  if (await isGovScreenshotImage(img, brightRatio, darkRatio, variance)) {
    return true;
  }

  return false;
}

/**
 * Detect gov.uk-style website screenshots: bright page background
 * with chunky dark header/text blocks (e.g. large "GOV" lettering).
 */
export async function isGovScreenshotImage(
  img: HTMLImageElement,
  brightRatio?: number,
  darkRatio?: number,
  variance?: number
): Promise<boolean> {
  if (!img.naturalWidth || !img.naturalHeight) return false;

  let bright = brightRatio;
  let dark = darkRatio;
  let varValue = variance;

  if (bright === undefined || dark === undefined || varValue === undefined) {
    const data = sampleImagePixels(img);
    if (!data) return false;

    const pixels = 48 * 48;
    let brightPixels = 0;
    let darkPixels = 0;
    let totalBrightness = 0;
    let varianceSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const value = (r + g + b) / 3;
      totalBrightness += value;
      if (r > 215 && g > 215 && b > 215) brightPixels += 1;
      if (value < 85) darkPixels += 1;
    }

    const avg = totalBrightness / pixels;
    for (let i = 0; i < data.length; i += 4) {
      const value = (data[i] + data[i + 1] + data[i + 2]) / 3;
      varianceSum += (value - avg) ** 2;
    }

    bright = brightPixels / pixels;
    dark = darkPixels / pixels;
    varValue = varianceSum / pixels;
  }

  return bright > 0.55 && dark > 0.06 && dark < 0.32 && varValue > 900;
}

export function sourceGradientBackground(sourceColor: string): string {
  const accent = sourceColor.startsWith("#") ? sourceColor : "#1e3a5f";
  return `linear-gradient(155deg, #050505 0%, ${accent}55 38%, #0c0c14 72%, #000000 100%)`;
}
