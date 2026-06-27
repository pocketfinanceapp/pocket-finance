"use client";

interface StreakHeroIconProps {
  className?: string;
  size?: number;
  active?: boolean;
  uid?: string;
}

/** Animated streak flame — minimal vector hero graphic. */
export function StreakHeroIcon({
  className = "",
  size = 56,
  active = true,
  uid = "default",
}: StreakHeroIconProps) {
  const id = uid.replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`${active ? "streak-flame-animate" : ""} ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`streak-glow-${id}`} x1="32" y1="8" x2="32" y2="58">
          <stop stopColor="#FDE68A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#F97316" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`streak-flame-${id}`} x1="32" y1="10" x2="32" y2="54">
          <stop stopColor="#FEF08A" />
          <stop offset="0.45" stopColor="#FB923C" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id={`streak-core-${id}`} x1="32" y1="28" x2="32" y2="48">
          <stop stopColor="#FFFBEB" />
          <stop offset="1" stopColor="#FED7AA" stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {active && (
        <ellipse
          cx="32"
          cy="44"
          rx="18"
          ry="10"
          fill={`url(#streak-glow-${id})`}
          className="streak-glow-pulse"
        />
      )}

      <path
        d="M32 54c8.5-4.5 13-11.5 13-20.5C45 22 38.5 16 32 20c-2.2 3.2-5.5 5.5-8 9.2C20 35 21 44.5 27 50c2 1.8 3.5 3 5 4z"
        fill={`url(#streak-flame-${id})`}
        opacity={active ? 1 : 0.35}
      />
      <path
        d="M32 46c3.2-2 5.5-5.5 5.5-9.8 0-3.2-1.8-5.8-5.5-7.5-1.5 2.2-3 3.8-3.8 6.2-.9 2.8-.2 6 2.2 8.2 1 1 2.2 1.8 3.6 2.9z"
        fill={`url(#streak-core-${id})`}
        opacity={active ? 0.95 : 0.4}
      />
    </svg>
  );
}
