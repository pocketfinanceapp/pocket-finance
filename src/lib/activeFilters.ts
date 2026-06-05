import type { MarketFilter, SectorFilter } from "./filters";
import { getMarketById } from "./markets";

/** Labels for filters the user explicitly applied (Discover / market drill-down) */
export function getExplicitFilterLabels(
  marketFilters: MarketFilter[],
  sectorFilters: SectorFilter[],
  searchQuery: string
): string[] {
  const labels: string[] = [];
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
  searchQuery: string
): boolean {
  return getExplicitFilterLabels(marketFilters, sectorFilters, searchQuery).length > 0;
}
