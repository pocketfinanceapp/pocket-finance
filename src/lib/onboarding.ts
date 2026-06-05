const COMPLETE_KEY = "pocket-onboarding-complete";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COMPLETE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPLETE_KEY, "true");
  } catch {
    /* private mode / quota */
  }
}
