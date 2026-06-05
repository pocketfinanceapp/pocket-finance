"use client";

import { useRouter } from "next/navigation";
import { MobilePageShell } from "./MobilePageShell";
import { WatchlistPage } from "./WatchlistPage";

export function WatchlistScreen() {
  const router = useRouter();

  return (
    <MobilePageShell activeTab="watchlist">
      <WatchlistPage onClose={() => router.push("/")} />
    </MobilePageShell>
  );
}
