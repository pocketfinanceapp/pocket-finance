const FEED_ONBOARDING_KEY = "pf-onboarded";

export function isFeedOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(FEED_ONBOARDING_KEY) === "true";
  } catch {
    return true;
  }
}

export function markFeedOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FEED_ONBOARDING_KEY, "true");
    window.dispatchEvent(new CustomEvent("pf-onboarding-dismissed"));
  } catch {
    /* private mode / quota */
  }
}

const SWIPE_HINT_KEY = "pf-seen-swipe-hint";

export function hasSeenSwipeHint(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SWIPE_HINT_KEY) === "true";
  } catch {
    return true;
  }
}

export function markSwipeHintSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SWIPE_HINT_KEY, "true");
  } catch {
    /* private mode / quota */
  }
}
