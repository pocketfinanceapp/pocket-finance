"use client";

import { useEffect } from "react";
import {
  applyThemeToDocument,
  loadStoredThemePreference,
  resolveThemePreference,
} from "@/lib/theme";

/** Pins the document to dark mode while mounted (landing, login, password reset). */
export function ForceDarkTheme({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#0a0a0a");

    return () => {
      const resolved = resolveThemePreference(loadStoredThemePreference());
      applyThemeToDocument(resolved);
    };
  }, []);

  return <>{children}</>;
}
