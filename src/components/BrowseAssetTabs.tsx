type BrowseAssetTab = "companies" | "markets" | "crypto";

interface BrowseAssetTabsProps {
  active: BrowseAssetTab;
  onChange: (tab: BrowseAssetTab) => void;
}

const TABS: { id: BrowseAssetTab; label: string }[] = [
  { id: "companies", label: "Companies" },
  { id: "markets", label: "Markets" },
  { id: "crypto", label: "Crypto" },
];

export function BrowseAssetTabs({ active, onChange }: BrowseAssetTabsProps) {
  return (
    <div
      className="flex w-full gap-1 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] p-1"
      role="tablist"
      aria-label="Browse categories"
    >
      {TABS.map((tab) => {
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            data-no-drag
            onClick={() => onChange(tab.id)}
            className={`min-w-0 flex-1 rounded-[14px] px-2 py-2.5 text-center text-[13px] font-semibold transition-all duration-200 ${
              selected
                ? "bg-[var(--pocket-card)] text-pocket-text shadow-[var(--pocket-shadow)]"
                : "text-pocket-muted active:text-pocket-text"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
