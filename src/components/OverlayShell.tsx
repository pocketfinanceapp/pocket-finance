"use client";

import { BOTTOM_NAV_HEIGHT } from "@/lib/layout";

/** Full-screen opaque overlay — blocks feed bleed, reserves space for bottom nav */
export function OverlayShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black">
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      {/* Solid black fill behind the nav so the feed never shows through */}
      <div
        className="shrink-0 bg-black"
        style={{ height: BOTTOM_NAV_HEIGHT }}
        aria-hidden
      />
    </div>
  );
}
