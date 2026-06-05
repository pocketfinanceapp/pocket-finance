const COMPLETE_KEY = "pocket-onboarding-complete";

function storageKey(userId?: string): string {
  return userId ? `${COMPLETE_KEY}-${userId}` : COMPLETE_KEY;
}

export function isOnboardingComplete(userId?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(storageKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingComplete(userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), "true");
  } catch {
    /* private mode / quota */
  }
}

export function clearOnboardingComplete(userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}
