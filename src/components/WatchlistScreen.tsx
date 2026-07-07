"use client";

import { MobilePageShell } from "./MobilePageShell";
import { WatchlistPage } from "./WatchlistPage";

export function WatchlistScreen() {
  return (
    <MobilePageShell activeTab="discover">
      <WatchlistPage />
    </MobilePageShell>
  );
}
