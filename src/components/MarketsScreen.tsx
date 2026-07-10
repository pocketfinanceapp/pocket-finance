"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import type { MarketFilter } from "@/lib/filters";
import { APP_BASE } from "@/lib/appPaths";
import { GlobalCompanyPanel } from "./GlobalCompanyPanel";
import { MarketsPage } from "./MarketsPage";
import { MobilePageShell } from "./MobilePageShell";

export function MarketsScreen() {
  const router = useRouter();
  const { setMarketFilters, requestCompanyPanel } = useApp();

  const openMarketFeed = (market: MarketFilter) => {
    setMarketFilters([market]);
    router.push(APP_BASE);
  };

  const openCompany = useCallback(
    (ticker: string) => {
      requestCompanyPanel(ticker, "markets");
    },
    [requestCompanyPanel]
  );

  return (
    <MobilePageShell activeTab="markets">
      <div className="relative h-full w-full">
        <MarketsPage
          onOpenMarketFeed={openMarketFeed}
          onOpenCompany={openCompany}
        />
        <GlobalCompanyPanel />
      </div>
    </MobilePageShell>
  );
}
