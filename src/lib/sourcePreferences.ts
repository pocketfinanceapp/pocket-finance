const KEY = "pocket-hidden-sources";

/** News sources (by sourceName) the user has chosen to hide from their feed. */
export function loadHiddenSources(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function saveHiddenSources(sources: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(sources));
  } catch {
    /* storage blocked */
  }
}
