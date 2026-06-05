"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { MarketFilter } from "@/lib/filters";
import { MarketsPage } from "./MarketsPage";
import { MobilePageShell } from "./MobilePageShell";

export function MarketsScreen() {
  const router = useRouter();
  const { setMarketFilters } = useApp();

  const openMarketFeed = (market: MarketFilter) => {
    setMarketFilters([market]);
    router.push("/");
  };

  return (
    <MobilePageShell activeTab="markets">
      <MarketsPage onOpenMarketFeed={openMarketFeed} />
    </MobilePageShell>
  );
}
