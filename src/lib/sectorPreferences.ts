import type { SectorFilter } from "./filters";

const KEY = "pocket-sector-interests";

export function loadSectorInterests(): SectorFilter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SectorFilter[];
  } catch {
    return [];
  }
}

export function saveSectorInterests(sectors: SectorFilter[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(sectors));
}
