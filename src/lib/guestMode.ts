const GUEST_MODE_KEY = "pf-guest-mode";

export function isGuestMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(GUEST_MODE_KEY) === "true";
  } catch {
    return false;
  }
}

export function enableGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_MODE_KEY, "true");
  } catch {
    /* private mode / quota */
  }
}

export function clearGuestMode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_MODE_KEY);
  } catch {
    /* ignore */
  }
}
