"use client";

import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import { articleFromTicker } from "@/lib/companyPanelArticle";
import type { NewsArticle } from "@/lib/types";
import { OverlayPanel } from "./SubPageShell";
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

  const open = Boolean(companyPanelTicker);

  const handleBack = () => {
    const returnTab = companyPanelReturnTab;
    clearCompanyPanelRequest();
    clearCompanyPanelReturnTab();
    if (returnTab) {
      navigate(returnTab);
    }
  };

  return (
    <OverlayPanel open={open} onClose={handleBack}>
      {companyPanelTicker ? (
        <StockPanel
          article={articleFromTicker(companyPanelTicker)}
          catalogArticles={catalogArticles}
          onBack={handleBack}
          onOpenTicker={(symbol) => requestCompanyPanel(symbol)}
        />
      ) : null}
    </OverlayPanel>
  );
}
