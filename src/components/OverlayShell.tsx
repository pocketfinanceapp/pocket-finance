"use client";

import { BOTTOM_NAV_HEIGHT } from "@/lib/layout";

/** Full-viewport opaque overlay — solid black, no gaps, feed cannot bleed through */
export function OverlayShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 z-[45] bg-black"
      style={{ height: "100dvh", minHeight: "100dvh" }}
    >
      <div
        className="absolute inset-x-0 top-0 flex flex-col overflow-hidden bg-black"
        style={{ bottom: BOTTOM_NAV_HEIGHT }}
      >
        {children}
      </div>
    </div>
  );
}
