import { fuzzyMatchesQuery } from "./fuzzySearch";
import { getBrowsableCompanyTickers } from "./catalogTickers";
import { getTickerMetaBySymbol, type TickerMeta } from "./tickerMap";
import { isUnquotableTicker } from "./twelveDataSymbolOverrides";

export interface ExploreCompany {
  ticker: string;
  meta: TickerMeta;
}

export function getExploreCompanies(): ExploreCompany[] {
  return getBrowsableCompanyTickers()
    .filter((ticker) => !isUnquotableTicker(ticker))
    .map((ticker) => ({
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
