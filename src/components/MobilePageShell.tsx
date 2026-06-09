"use client";

import { APP_VIEWPORT_HEIGHT, FEED_VIEWPORT_HEIGHT } from "@/lib/layout";
import { BottomNav, type NavTab } from "./BottomNav";

interface MobilePageShellProps {
  activeTab: NavTab;
  children: React.ReactNode;
}

/** Full-screen shell — feed area above a fixed 65px bottom nav */
export function MobilePageShell({
  activeTab,
  children,
}: MobilePageShellProps) {
  return (
    <div
      className="relative mx-auto w-full max-w-mobile overflow-hidden bg-black"
      style={{ height: APP_VIEWPORT_HEIGHT, maxHeight: APP_VIEWPORT_HEIGHT }}
    >
      <div
        className="absolute inset-x-0 top-0 overflow-hidden bg-black"
        style={{ height: FEED_VIEWPORT_HEIGHT }}
      >
        {children}
      </div>
      <BottomNav active={activeTab} />
    </div>
  );
}
