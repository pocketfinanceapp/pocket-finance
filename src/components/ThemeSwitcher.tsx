"use client";

import { Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  THEME_ORDER,
  THEMES,
  type AppTheme,
} from "@/lib/theme";

const THEME_ICONS: Record<AppTheme, typeof Moon> = {
  dark: Moon,
  light: Sun,
  "modern-light": Sparkles,
};

interface ThemeSwitcherProps {
  variant?: "icon" | "picker";
}

/** Compact icon button (Profile header) or full 3-option picker (Settings). */
export function ThemeSwitcher({ variant = "icon" }: ThemeSwitcherProps) {
  const { theme, setTheme, cycleTheme } = useTheme();
  const Icon = THEME_ICONS[theme];
  const meta = THEMES[theme];

  if (variant === "picker") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {THEME_ORDER.map((id) => {
          const def = THEMES[id];
          const active = theme === id;
          const OptionIcon = THEME_ICONS[id];
          return (
            <button
              key={id}
              type="button"
              data-no-drag
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-center transition-all active:scale-[0.98] ${
                active
                  ? "border-[#00C6C6]/40 bg-[#00C6C6]/10 shadow-[0_0_0_1px_rgba(0,198,198,0.15)]"
                  : "border-[var(--pocket-border)] bg-[var(--pocket-card)]"
              }`}
            >
              <OptionIcon
                className={`h-5 w-5 ${
                  active ? "text-[#00C6C6]" : "text-[var(--pocket-text-muted)]"
                }`}
              />
              <span
                className={`mt-2 text-[11px] font-semibold leading-tight ${
                  active ? "text-[var(--pocket-text)]" : "text-[var(--pocket-text-muted)]"
                }`}
              >
                {def.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-no-drag
      onClick={cycleTheme}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)] transition-colors active:bg-[var(--pocket-surface-hover)]"
      aria-label={`Theme: ${meta.label}. Tap to change.`}
      title={meta.label}
    >
      <Icon className="h-5 w-5 text-[#00C6C6]" strokeWidth={2.25} />
    </button>
  );
}
