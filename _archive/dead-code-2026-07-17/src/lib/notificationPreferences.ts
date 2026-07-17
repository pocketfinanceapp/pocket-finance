const KEY = "pocket-notifications-enabled";

export function loadNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
}

export function saveNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, String(enabled));
}
