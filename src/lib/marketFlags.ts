/** ISO 3166-1 alpha-2 (plus `eu`) → flag emoji fallback */
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

/** Self-hosted flag asset in /public/flags */
export function getMarketFlagPath(countryCode: string): string {
  return `/flags/${countryCode.toLowerCase()}.png`;
}

/** @deprecated Use getMarketFlagPath — kept for any external references */
export function getMarketFlagUrl(countryCode: string, width = 80): string {
  return getMarketFlagPath(countryCode);
}

/** @deprecated No longer needed for self-hosted assets */
export function getMarketFlagSrcWidth(displaySize: number): number {
  return Math.max(80, Math.round(displaySize * 2.5));
}

export function getMarketFlagEmoji(countryCode: string): string {
  return FLAG_EMOJI[countryCode.toLowerCase()] ?? "🏳️";
}
