/** ISO 3166-1 alpha-2 country codes for market venues */
export function getMarketFlagUrl(countryCode: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}

/** Request a CDN width ~2.5× display size for crisp rendering on retina screens */
export function getMarketFlagSrcWidth(displaySize: number): number {
  return Math.max(80, Math.round(displaySize * 2.5));
}
