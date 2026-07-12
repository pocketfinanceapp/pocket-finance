export const APP_BASE = "/home";
export const LOGIN_PATH = "/login";

export function appPath(segment = ""): string {
  if (!segment) return APP_BASE;
  return `${APP_BASE}/${segment.replace(/^\//, "")}`;
}
