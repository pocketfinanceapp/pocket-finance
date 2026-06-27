interface FeedSearchIconProps {
  active?: boolean;
  className?: string;
}

/** Branded search control for the feed header — gradient ring + lens icon. */
export function FeedSearchIcon({ active = false, className = "" }: FeedSearchIconProps) {
  return (
    <span
      className={`relative flex h-10 w-10 items-center justify-center ${className}`}
    >
      <span
        aria-hidden
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          active
            ? "scale-100 opacity-100 feed-search-ring-active"
            : "scale-90 opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(135deg, rgba(59,110,245,0.35), rgba(0,198,198,0.28))",
          boxShadow: "0 0 0 1px rgba(59,110,245,0.35)",
        }}
      />
      <span
        aria-hidden
        className={`absolute inset-[3px] rounded-full transition-all duration-300 ${
          active ? "bg-black/80" : "bg-white/[0.06]"
        }`}
      />
      <svg
        className={`relative z-[1] h-[18px] w-[18px] transition-transform duration-300 ${
          active ? "scale-110" : "scale-100"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="pf-search-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B6EF5" />
            <stop offset="100%" stopColor="#00C6C6" />
          </linearGradient>
        </defs>
        <circle
          cx="10.5"
          cy="10.5"
          r="6.25"
          stroke={active ? "url(#pf-search-grad)" : "rgba(255,255,255,0.88)"}
          strokeWidth="2"
        />
        <path
          d="M15.5 15.5L20 20"
          stroke={active ? "url(#pf-search-grad)" : "rgba(255,255,255,0.88)"}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
