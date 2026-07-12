export type AppTheme = "dark" | "light";
export type ThemePreference = "system" | AppTheme;

export const THEME_STORAGE_KEY = "pf_theme_v1";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export const THEME_ORDER: ThemePreference[] = ["system", "dark", "light"];

export interface ThemeDefinition {
  id: ThemePreference;
  label: string;
  shortLabel: string;
  description: string;
  themeColor?: string;
}

export const THEMES: Record<ThemePreference, ThemeDefinition> = {
  system: {
    id: "system",
    label: "System default",
    shortLabel: "System",
    description: "Match your device appearance",
  },
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
};

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === "dark" || value === "light";
}

export function isThemePreference(
  value: string | null | undefined
): value is ThemePreference {
  return value === "system" || isAppTheme(value);
}

export function resolveSystemTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function resolveThemePreference(preference: ThemePreference): AppTheme {
  if (preference === "system") return resolveSystemTheme();
  return preference;
}

export function loadStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "modern-light") return "light";
    return isThemePreference(raw) ? raw : DEFAULT_THEME_PREFERENCE;
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

/** @deprecated Use loadStoredThemePreference */
export function loadStoredTheme(): AppTheme {
  return resolveThemePreference(loadStoredThemePreference());
}

export function saveStoredThemePreference(preference: ThemePreference): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* storage blocked */
  }
}

/** @deprecated Use saveStoredThemePreference */
export function saveStoredTheme(theme: AppTheme): void {
  saveStoredThemePreference(theme);
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  const idx = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute(
      "content",
      THEMES[theme].themeColor ?? (theme === "light" ? "#f2f2f7" : "#0a0a0a")
    );
  }
}

/** @deprecated Use nextThemePreference */
export function nextTheme(current: AppTheme): AppTheme {
  return current === "dark" ? "light" : "dark";
}
