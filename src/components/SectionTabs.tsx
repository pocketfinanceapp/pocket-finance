interface SectionTab<T extends string> {
  id: T;
  label: string;
}

interface SectionTabsProps<T extends string> {
  tabs: SectionTab<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function SectionTabs<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
}: SectionTabsProps<T>) {
  return (
    <div
      className={`flex gap-6 border-b border-[var(--pocket-border)] px-4 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-no-drag
          onClick={() => onChange(tab.id)}
          className={`relative shrink-0 pb-2.5 text-[13px] font-semibold transition-colors ${
            active === tab.id ? "text-pocket-text" : "text-pocket-muted"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span
              className="pf-section-tab-indicator absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]"
              aria-hidden
            />
          )}
        </button>
      ))}
    </div>
  );
}
