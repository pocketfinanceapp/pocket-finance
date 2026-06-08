export const APP_BASE = "/app";

export function appPath(segment = ""): string {
  if (!segment) return APP_BASE;
  return `${APP_BASE}/${segment.replace(/^\//, "")}`;
}
