interface FeedSearchIconProps {
  active?: boolean;
  className?: string;
}

/** Branded search control for the feed header — ring + lens icon. */
export function FeedSearchIcon({ active = false, className = "" }: FeedSearchIconProps) {
  return (
    <span
      className={`relative flex h-10 w-10 items-center justify-center text-pocket-text ${className}`}
    >
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full border transition-all duration-300 ${
          active
            ? "scale-100 border-pocket-teal/40 bg-pocket-teal/10 opacity-100 feed-search-ring-active"
            : "scale-90 border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] opacity-100"
        }`}
      />
      <svg
        className={`relative z-[1] h-[18px] w-[18px] transition-transform duration-300 ${
          active ? "scale-110 text-pocket-teal" : "scale-100"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="10.5" cy="10.5" r="6.25" stroke="currentColor" strokeWidth="2" />
        <path
          d="M15.5 15.5L20 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
