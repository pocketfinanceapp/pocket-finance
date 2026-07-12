export const APP_BASE = "/home";

export function appPath(segment = ""): string {
  if (!segment) return APP_BASE;
  return `${APP_BASE}/${segment.replace(/^\//, "")}`;
}
