"use client";

import { APP_VIEWPORT_HEIGHT, FEED_VIEWPORT_HEIGHT } from "@/lib/layout";
import { BottomNav, type NavTab } from "./BottomNav";

interface MobilePageShellProps {
  activeTab: NavTab;
  children: React.ReactNode;
  /** Hide bottom nav and expand content to full viewport (e.g. article panel open) */
  hideBottomNav?: boolean;
}

/** Full-screen shell — feed area above a fixed 65px bottom nav */
export function MobilePageShell({
  activeTab,
  children,
  hideBottomNav = false,
}: MobilePageShellProps) {
  const contentHeight = hideBottomNav ? APP_VIEWPORT_HEIGHT : FEED_VIEWPORT_HEIGHT;

  return (
    <div
      className="relative mx-auto w-full max-w-mobile overflow-hidden bg-black"
      style={{ height: APP_VIEWPORT_HEIGHT, maxHeight: APP_VIEWPORT_HEIGHT }}
    >
      <div
        className="absolute inset-x-0 top-0 overflow-hidden bg-black"
        style={{ height: contentHeight }}
      >
        {children}
      </div>
      {!hideBottomNav && <BottomNav active={activeTab} />}
    </div>
  );
}
