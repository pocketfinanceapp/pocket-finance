const COMPLETE_KEY = "pocket-onboarding-complete";
export const PF_ONBOARDING_COMPLETE_KEY = "pf_onboarding_complete";

const FOLLOWED_MARKETS_KEY = "pocket-followed-markets";
const SECTOR_INTERESTS_KEY = "pocket-sector-interests";

function storageKey(userId?: string): string {
  return userId ? `${COMPLETE_KEY}-${userId}` : COMPLETE_KEY;
}

/** True when the user has saved market or sector preferences from a prior session. */
export function hasSavedOnboardingPreferences(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const marketsRaw = localStorage.getItem(FOLLOWED_MARKETS_KEY);
    if (marketsRaw) {
      const markets = JSON.parse(marketsRaw) as unknown;
      if (Array.isArray(markets) && markets.length > 0) return true;
    }

    const sectorsRaw = localStorage.getItem(SECTOR_INTERESTS_KEY);
    if (sectorsRaw) {
      const sectors = JSON.parse(sectorsRaw) as unknown;
      if (Array.isArray(sectors) && sectors.length > 0) return true;
    }
  } catch {
    /* ignore parse/storage errors */
  }
  return false;
}

/**
 * Complete only when markets/sectors were actually saved.
 * A completion flag alone is not enough (avoids skipping personalization).
 */
export function isOnboardingComplete(userId?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Preferences are the source of truth for personalization.
    if (hasSavedOnboardingPreferences()) return true;

    // Incomplete: flagged done but no prefs — treat as not complete.
    void userId;
    return false;
  } catch {
    return false;
  }
}

export function markOnboardingComplete(userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PF_ONBOARDING_COMPLETE_KEY, "true");
    localStorage.setItem(storageKey(userId), "true");
  } catch {
    /* private mode / quota */
  }
}

export function clearOnboardingComplete(userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PF_ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}
