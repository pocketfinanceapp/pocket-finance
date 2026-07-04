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
  DEFAULT_THEME,
  loadStoredTheme,
  nextTheme,
  saveStoredTheme,
  type AppTheme,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(DEFAULT_THEME);

  useEffect(() => {
    const stored = loadStoredTheme();
    setThemeState(stored);
    applyThemeToDocument(stored);
  }, []);

  const setTheme = useCallback((next: AppTheme) => {
    setThemeState(next);
    saveStoredTheme(next);
    applyThemeToDocument(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = nextTheme(current);
      saveStoredTheme(next);
      applyThemeToDocument(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme]
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
