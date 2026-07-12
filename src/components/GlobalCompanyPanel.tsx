"use client";

import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import { articleFromTicker } from "@/lib/companyPanelArticle";
import type { NewsArticle } from "@/lib/types";
import { StockPanel } from "./StockPanel";

interface GlobalCompanyPanelProps {
  catalogArticles?: NewsArticle[];
}

export function GlobalCompanyPanel({
  catalogArticles = [],
}: GlobalCompanyPanelProps) {
  const {
    companyPanelTicker,
    companyPanelReturnTab,
    clearCompanyPanelRequest,
    clearCompanyPanelReturnTab,
    requestCompanyPanel,
  } = useApp();
  const { navigate } = useNavigation();

  if (!companyPanelTicker) return null;

  const handleBack = () => {
    const returnTab = companyPanelReturnTab;
    clearCompanyPanelRequest();
    clearCompanyPanelReturnTab();
    if (returnTab) {
      navigate(returnTab);
    }
  };

  return (
    <div className="absolute inset-0 z-50 h-full w-full bg-pocket-bg">
      <StockPanel
        article={articleFromTicker(companyPanelTicker)}
        catalogArticles={catalogArticles}
        onBack={handleBack}
        onOpenTicker={(symbol) => requestCompanyPanel(symbol)}
      />
    </div>
  );
}
