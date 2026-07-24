import type { MarketFilter, SectorFilter } from "./filters";
import { getMarketById } from "./markets";
import { countryName } from "./countryNames";

/** Labels for filters the user explicitly applied (Discover / market drill-down) */
export function getExplicitFilterLabels(
  marketFilters: MarketFilter[],
  sectorFilters: SectorFilter[],
  searchQuery: string,
  countryFilter?: string | null
): string[] {
  const labels: string[] = [];
  // Browse by Region (Explore) sets countryFilter via the same clearFilters
  // + setCountryFilter path the other drill-downs use, but this function
  // didn't know about it — the feed itself correctly filtered to that
  // country's articles, but the pill that shows what's filtered (and lets
  // you clear it) silently never appeared, since hasExplicitFilters()
  // returned false with no market/sector/search filters active.
  if (countryFilter) labels.push(countryName(countryFilter));
  for (const s of sectorFilters) labels.push(s);
  for (const m of marketFilters) {
    labels.push(getMarketById(m)?.name ?? m);
  }
  const q = searchQuery.trim();
  if (q) labels.push(q);
  return labels;
}

export function hasExplicitFilters(
  marketFilters: MarketFilter[],
  sectorFilters: SectorFilter[],
  searchQuery: string,
  countryFilter?: string | null
): boolean {
  return (
    getExplicitFilterLabels(
      marketFilters,
      sectorFilters,
      searchQuery,
      countryFilter
    ).length > 0
  );
}
