"use client";

import { BOTTOM_NAV_HEIGHT } from "@/lib/layout";
import { BottomNav, type NavTab } from "./BottomNav";

interface MobilePageShellProps {
  activeTab: NavTab;
  children: React.ReactNode;
  onCreate?: () => void;
}

/** Full-screen mobile page with fixed bottom nav — no feed or overlays underneath */
export function MobilePageShell({
  activeTab,
  children,
  onCreate,
}: MobilePageShellProps) {
  return (
    <div className="relative mx-auto h-[100dvh] w-full max-w-mobile overflow-hidden bg-black">
      <div
        className="absolute inset-x-0 top-0 overflow-hidden bg-black"
        style={{ bottom: BOTTOM_NAV_HEIGHT }}
      >
        {children}
      </div>
      <BottomNav active={activeTab} onCreate={onCreate} />
    </div>
  );
}
