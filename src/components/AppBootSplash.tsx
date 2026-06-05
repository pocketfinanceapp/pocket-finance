"use client";

import { PocketBrand } from "@/components/PocketLogo";

/** Full-screen splash while client state hydrates from localStorage */
export function AppBootSplash() {
  return (
    <div
      className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6"
      style={{ backgroundColor: "#0a0a0a", minHeight: "100dvh" }}
    >
      <PocketBrand
        layout="vertical"
        iconSize={88}
        glow="strong"
        showTagline
      />
      <div className="mt-10 h-1 w-24 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
      </div>
    </div>
  );
}
