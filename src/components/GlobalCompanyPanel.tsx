"use client";

import { useApp } from "@/context/AppContext";
import { useNavigation } from "@/context/NavigationContext";
import { articleFromTicker } from "@/lib/companyPanelArticle";
import { StockPanel } from "./StockPanel";

export function GlobalCompanyPanel() {
  const {
    companyPanelTicker,
    companyPanelReturnTab,
    clearCompanyPanelRequest,
    clearCompanyPanelReturnTab,
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
        onBack={handleBack}
      />
    </div>
  );
}
