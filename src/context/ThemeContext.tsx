"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeToDocument,
  DEFAULT_THEME_PREFERENCE,
  loadStoredThemePreference,
  nextThemePreference,
  resolveThemePreference,
  saveStoredThemePreference,
  type AppTheme,
  type ThemePreference,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: AppTheme;
  preference: ThemePreference;
  setTheme: (theme: AppTheme) => void;
  setPreference: (preference: ThemePreference) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    DEFAULT_THEME_PREFERENCE
  );
  const [theme, setThemeState] = useState<AppTheme>("dark");

  const applyPreference = useCallback((nextPreference: ThemePreference) => {
    const resolved = resolveThemePreference(nextPreference);
    setPreferenceState(nextPreference);
    setThemeState(resolved);
    saveStoredThemePreference(nextPreference);
    applyThemeToDocument(resolved);
  }, []);

  useEffect(() => {
    applyPreference(loadStoredThemePreference());
  }, [applyPreference]);

  const setTheme = useCallback(
    (next: AppTheme) => {
      applyPreference(next);
    },
    [applyPreference]
  );

  const setPreference = useCallback(
    (next: ThemePreference) => {
      applyPreference(next);
    },
    [applyPreference]
  );

  const cycleTheme = useCallback(() => {
    applyPreference(nextThemePreference(preference));
  }, [applyPreference, preference]);

  const value = useMemo(
    () => ({ theme, preference, setTheme, setPreference, cycleTheme }),
    [theme, preference, setTheme, setPreference, cycleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}
