"use client";

import { useState } from "react";
import { PocketBrand } from "@/components/PocketLogo";
import type { AppTheme } from "@/lib/theme";

function readBootTheme(): AppTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

interface AppBootSplashProps {
  /** Keeps splash dark (e.g. login route). */
  forceDark?: boolean;
}

/** Full-screen splash while client state hydrates from localStorage */
export function AppBootSplash({ forceDark = false }: AppBootSplashProps) {
  const [theme] = useState<AppTheme>(() =>
    forceDark ? "dark" : readBootTheme()
  );
  const isLight = theme === "light";

  return (
    <div
      className="pf-boot-splash app-shell-height flex flex-col items-center justify-center bg-pocket-bg px-6"
      data-boot-theme={isLight ? "light" : "dark"}
    >
      <PocketBrand
        layout="vertical"
        iconSize={88}
        glow={isLight ? "normal" : "strong"}
        showTagline
        wordmarkClassName="text-pocket-text"
      />
      <div className="pf-boot-progress-track mt-10 h-1 w-24 overflow-hidden rounded-full bg-[var(--pocket-surface-hover)]">
        <div className="pf-boot-progress-bar h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
      </div>
    </div>
  );
}
