import { fuzzyMatchesQuery } from "./fuzzySearch";
import { getTickerMetaBySymbol, type TickerMeta } from "./tickerMap";

export const EXPLORE_COMPANY_TICKERS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "AMZN",
  "META",
  "TSLA",
  "AMD",
  "NFLX",
  "JPM",
  "V",
  "MA",
  "BAC",
  "GS",
  "XOM",
  "CVX",
  "COIN",
  "BTC",
  "ETH",
  "DIS",
  "WMT",
  "KO",
  "NKE",
  "SBUX",
  "CRM",
  "ORCL",
  "UBER",
  "ABNB",
  "PLTR",
  "INTC",
  "AVGO",
  "QCOM",
  "SHOP",
  "PYPL",
  "BA",
  "JNJ",
  "PFE",
  "TSM",
  "ASML",
  "TM",
  "SONY",
  "BHP",
  "LLY",
  "COST",
  "HD",
  "MCD",
] as const;

export interface ExploreCompany {
  ticker: string;
  meta: TickerMeta;
}

export function getExploreCompanies(): ExploreCompany[] {
  return EXPLORE_COMPANY_TICKERS.map((ticker) => ({
    ticker,
    meta: getTickerMetaBySymbol(ticker),
  }));
}

export function filterExploreCompanies(
  companies: ExploreCompany[],
  query: string
): ExploreCompany[] {
  const q = query.trim();
  if (!q) return [];
  return companies.filter((company) =>
    fuzzyMatchesQuery(q, [
      company.ticker,
      company.meta.companyName,
      company.meta.sector,
      company.meta.market,
      ...company.meta.tags,
    ])
  );
}
