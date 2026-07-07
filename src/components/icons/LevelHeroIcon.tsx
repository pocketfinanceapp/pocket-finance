"use client";

interface LevelHeroIconProps {
  className?: string;
  size?: number;
  uid?: string;
}

/** Animated level chart — rising bars + trend line (pairs with StreakHeroIcon). */
export function LevelHeroIcon({
  className = "",
  size = 60,
  uid = "default",
}: LevelHeroIconProps) {
  const id = uid.replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`level-gem-animate ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`level-glow-${id}`} x1="32" y1="16" x2="32" y2="58">
          <stop stopColor="#5B8EF0" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00C6C6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`level-panel-${id}`} x1="12" y1="12" x2="52" y2="52">
          <stop stopColor="#3B6EF5" />
          <stop offset="0.55" stopColor="#5B8EF0" />
          <stop offset="1" stopColor="#00C6C6" />
        </linearGradient>
        <linearGradient id={`level-bar-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#E0F2FE" />
          <stop offset="1" stopColor="#00C6C6" />
        </linearGradient>
      </defs>

      <ellipse
        cx="32"
        cy="46"
        rx="22"
        ry="10"
        fill={`url(#level-glow-${id})`}
        className="level-gem-glow-pulse"
      />

      {/* Chart panel */}
      <rect
        x="10"
        y="12"
        width="44"
        height="40"
        rx="11"
        fill={`url(#level-panel-${id})`}
      />
      <rect
        x="10"
        y="12"
        width="44"
        height="40"
        rx="11"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />

      {/* Subtle grid */}
      <path
        d="M16 38 H48 M16 32 H48 M16 26 H48"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Ascending candlesticks / bars */}
      <rect x="17" y="36" width="5" height="10" rx="1.5" fill="rgba(255,255,255,0.35)" />
      <rect x="17" y="34" width="5" height="2" rx="0.5" fill="rgba(255,255,255,0.5)" />

      <rect x="26" y="30" width="5" height="16" rx="1.5" fill={`url(#level-bar-${id})`} opacity={0.85} />
      <rect x="26" y="28" width="5" height="2" rx="0.5" fill="#E0F2FE" />

      <rect x="35" y="24" width="5" height="22" rx="1.5" fill={`url(#level-bar-${id})`} />
      <rect x="35" y="22" width="5" height="2" rx="0.5" fill="#E0F2FE" />

      <rect x="44" y="18" width="5" height="28" rx="1.5" fill="#ffffff" opacity={0.95} />
      <rect x="44" y="16" width="5" height="2" rx="0.5" fill="#ffffff" />

      {/* Trend line */}
      <path
        d="M15 40 L24 33 L33 27 L42 21 L49 17"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />

      {/* Up arrow — market momentum */}
      <path
        d="M49 17 L49 11 M49 11 L46 14 M49 11 L52 14"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
    </svg>
  );
}
