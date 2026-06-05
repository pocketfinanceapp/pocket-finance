"use client";

import { FEED_VIEWPORT_HEIGHT } from "@/lib/layout";
import { BottomNav, type NavTab } from "./BottomNav";

interface MobilePageShellProps {
  activeTab: NavTab;
  children: React.ReactNode;
  onCreate?: () => void;
}

/** Full-screen shell — feed area above a fixed 65px bottom nav */
export function MobilePageShell({
  activeTab,
  children,
  onCreate,
}: MobilePageShellProps) {
  return (
    <div
      className="relative mx-auto w-full max-w-mobile overflow-hidden bg-black"
      style={{ height: "100svh", maxHeight: "100svh" }}
    >
      <div
        className="absolute inset-x-0 top-0 overflow-hidden bg-black"
        style={{ height: FEED_VIEWPORT_HEIGHT }}
      >
        {children}
      </div>
      <BottomNav active={activeTab} onCreate={onCreate} />
    </div>
  );
}
