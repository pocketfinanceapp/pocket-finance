import type { SectorFilter } from "./filters";

export interface SectorPerformance {
  id: SectorFilter;
  label: string;
  changePercent: number;
}

/** Demo sector performance — replace with live data when available. */
export function getSectorPerformance(): SectorPerformance[] {
  return [
    { id: "Technology", label: "Technology", changePercent: 1.24 },
    { id: "Energy", label: "Energy", changePercent: -0.68 },
    { id: "Healthcare", label: "Healthcare", changePercent: 0.42 },
    { id: "Finance", label: "Financials", changePercent: 0.91 },
    { id: "Consumer", label: "Consumer", changePercent: -0.15 },
    { id: "Mining", label: "Materials", changePercent: 0.33 },
    { id: "Real Estate", label: "Real Estate", changePercent: -0.52 },
  ];
}
