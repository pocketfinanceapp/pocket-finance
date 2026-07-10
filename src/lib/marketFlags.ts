/** ISO 3166-1 alpha-2 country codes for market venues */
export function getMarketFlagUrl(countryCode: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${countryCode.toLowerCase()}.png`;
}
