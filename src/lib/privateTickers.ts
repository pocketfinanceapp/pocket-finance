/** Known private / non-listed companies — no public market data */
export const PRIVATE_TICKERS = new Set([
  "OPENAI",
  "SPACEX",
  "ANTHROPIC",
  "STRIPE",
  "KLARNA",
  "CHIME",
]);

export function isPrivateTicker(ticker: string): boolean {
  return PRIVATE_TICKERS.has(ticker.toUpperCase());
}
