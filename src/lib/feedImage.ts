const LOW_QUALITY_URL_PATTERNS = [
  "logo",
  "icon",
  "badge",
  "placeholder",
  "default",
  "blank",
] as const;

/** URLs that usually resolve to logos, icons, or empty placeholders */
export function isLowQualityImageUrl(url: string): boolean {
  if (!url.trim()) return true;
  const lower = url.toLowerCase();
  return LOW_QUALITY_URL_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function hasUsableFeedImage(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  return !isLowQualityImageUrl(url);
}

/** Sample loaded image pixels — detects plain white/grey or logo-on-white cards */
export async function isPlainFeedImage(img: HTMLImageElement): Promise<boolean> {
  if (!img.naturalWidth || !img.naturalHeight) return false;

  const canvas = document.createElement("canvas");
  const size = 40;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  try {
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const pixels = size * size;
    let brightPixels = 0;
    let totalBrightness = 0;
    let varianceSum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const bright = (r + g + b) / 3;
      totalBrightness += bright;
      if (r > 215 && g > 215 && b > 215) brightPixels += 1;
    }

    const avg = totalBrightness / pixels;

    for (let i = 0; i < data.length; i += 4) {
      const bright = (data[i] + data[i + 1] + data[i + 2]) / 3;
      varianceSum += (bright - avg) ** 2;
    }

    const variance = varianceSum / pixels;

    if (brightPixels / pixels > 0.72) return true;
    if (avg > 205 && variance < 500) return true;
    if (avg > 175 && variance < 120) return true;

    return false;
  } catch {
    return false;
  }
}

export function sourceGradientBackground(sourceColor: string): string {
  const accent = sourceColor.startsWith("#") ? sourceColor : "#1e3a5f";
  return `linear-gradient(155deg, #050505 0%, ${accent}55 38%, #0c0c14 72%, #000000 100%)`;
}
