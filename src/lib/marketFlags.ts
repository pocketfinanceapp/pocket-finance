/** Self-hosted flag asset in /public/flags/{code}.png (w160 from flagcdn). */
export function getMarketFlagPath(countryCode: string): string {
  return `/flags/${countryCode.toLowerCase()}.png`;
}

/** True for ISO alpha-2 (and `eu`) — all catalog codes ship a PNG. */
export function hasLocalFlagAsset(countryCode: string): boolean {
  const code = countryCode.toLowerCase();
  return code === "eu" || /^[a-z]{2}$/.test(code);
}

/** @deprecated Use getMarketFlagPath — kept for any external references */
export function getMarketFlagUrl(countryCode: string, width = 80): string {
  return getMarketFlagPath(countryCode);
}

/** @deprecated No longer needed for self-hosted assets */
export function getMarketFlagSrcWidth(displaySize: number): number {
  return Math.max(80, Math.round(displaySize * 2.5));
}

/** Build a flag emoji from any ISO alpha-2 code (including Taiwan `tw`). */
export function getMarketFlagEmoji(countryCode: string): string {
  const code = countryCode.toLowerCase();
  if (code === "eu") return "🇪🇺";
  if (code.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  const chars = [...code.toUpperCase()].map((c) => {
    const offset = c.charCodeAt(0) - 65;
    if (offset < 0 || offset > 25) return "";
    return String.fromCodePoint(A + offset);
  });
  const emoji = chars.join("");
  return emoji || "🏳️";
}
