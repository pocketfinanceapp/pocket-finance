/** ISO 3166-1 alpha-2 (plus `eu`) → flag emoji for reliable offline display */
const FLAG_EMOJI: Record<string, string> = {
  au: "🇦🇺",
  us: "🇺🇸",
  gb: "🇬🇧",
  jp: "🇯🇵",
  hk: "🇭🇰",
  tw: "🇹🇼",
  ca: "🇨🇦",
  eu: "🇪🇺",
  sg: "🇸🇬",
  in: "🇮🇳",
  cn: "🇨🇳",
  kr: "🇰🇷",
  de: "🇩🇪",
  fr: "🇫🇷",
};

/** ISO 3166-1 alpha-2 country codes for market venues */
export function getMarketFlagUrl(countryCode: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}

/** Request a CDN width ~2.5× display size for crisp rendering on retina screens */
export function getMarketFlagSrcWidth(displaySize: number): number {
  return Math.max(80, Math.round(displaySize * 2.5));
}

export function getMarketFlagEmoji(countryCode: string): string {
  return FLAG_EMOJI[countryCode.toLowerCase()] ?? "🏳️";
}
