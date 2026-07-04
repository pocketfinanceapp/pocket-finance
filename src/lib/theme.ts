export type AppTheme = "dark" | "light" | "modern-light";

export const THEME_STORAGE_KEY = "pf_theme_v1";

export const DEFAULT_THEME: AppTheme = "dark";

export const THEME_ORDER: AppTheme[] = ["dark", "light", "modern-light"];

export interface ThemeDefinition {
  id: AppTheme;
  label: string;
  shortLabel: string;
  description: string;
  themeColor: string;
}

export const THEMES: Record<AppTheme, ThemeDefinition> = {
  dark: {
    id: "dark",
    label: "Dark",
    shortLabel: "Dark",
    description: "Classic Pocket Finance look",
    themeColor: "#0a0a0a",
  },
  light: {
    id: "light",
    label: "Light",
    shortLabel: "Light",
    description: "Clean and easy on the eyes",
    themeColor: "#f2f2f7",
  },
  "modern-light": {
    id: "modern-light",
    label: "Modern Light",
    shortLabel: "Modern",
    description: "Soft surfaces with refined accents",
    themeColor: "#f8fafc",
  },
};

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === "dark" || value === "light" || value === "modern-light";
}

export function loadStoredTheme(): AppTheme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isAppTheme(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveStoredTheme(theme: AppTheme): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage blocked */
  }
}

export function nextTheme(current: AppTheme): AppTheme {
  const idx = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEMES[theme].themeColor);
  }
}
