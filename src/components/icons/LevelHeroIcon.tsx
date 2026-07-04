"use client";

interface LevelHeroIconProps {
  className?: string;
  size?: number;
  level?: number;
  uid?: string;
}

/** Animated level gem — organic vector hero graphic (pairs with StreakHeroIcon). */
export function LevelHeroIcon({
  className = "",
  size = 60,
  level = 1,
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
        <linearGradient id={`level-glow-${id}`} x1="32" y1="12" x2="32" y2="58">
          <stop stopColor="#7C6CF8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#00C6C6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`level-gem-${id}`} x1="18" y1="8" x2="48" y2="56">
          <stop stopColor="#9DA8FF" />
          <stop offset="0.4" stopColor="#5B8EF0" />
          <stop offset="1" stopColor="#00C6C6" />
        </linearGradient>
        <linearGradient id={`level-core-${id}`} x1="32" y1="22" x2="32" y2="46">
          <stop stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#A5F3FC" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <ellipse
        cx="32"
        cy="42"
        rx="20"
        ry="11"
        fill={`url(#level-glow-${id})`}
        className="level-gem-glow-pulse"
      />

      <path
        d="M32 6 L52 22 L44 56 L20 56 L12 22 Z"
        fill={`url(#level-gem-${id})`}
        className="level-gem-shimmer"
      />
      <path
        d="M32 14 L44 24 L38 48 L26 48 L20 24 Z"
        fill={`url(#level-core-${id})`}
        opacity={0.92}
      />
      <path
        d="M32 6 L52 22 L44 56 L20 56 L12 22 Z"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
      />

      <text
        x="32"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="18"
        fontWeight="800"
        fontFamily="var(--font-inter), system-ui, sans-serif"
      >
        {level}
      </text>
    </svg>
  );
}
