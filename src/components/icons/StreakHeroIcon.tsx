"use client";

interface StreakHeroIconProps {
  className?: string;
  size?: number;
  active?: boolean;
  uid?: string;
}

/** Animated streak flame — layered vector with a smooth looping burn. */
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
          <stop stopColor="#FDE68A" stopOpacity="0.65" />
          <stop offset="0.55" stopColor="#FB923C" stopOpacity="0.28" />
          <stop offset="1" stopColor="#EA580C" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`streak-outer-${id}`} x1="32" y1="6" x2="32" y2="56">
          <stop stopColor="#FEF08A" />
          <stop offset="0.35" stopColor="#FB923C" />
          <stop offset="0.75" stopColor="#F97316" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id={`streak-mid-${id}`} x1="32" y1="16" x2="32" y2="52">
          <stop stopColor="#FFF7ED" />
          <stop offset="0.4" stopColor="#FDBA74" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id={`streak-core-${id}`} x1="32" y1="28" x2="32" y2="50">
          <stop stopColor="#FFFBEB" />
          <stop offset="0.55" stopColor="#FED7AA" />
          <stop offset="1" stopColor="#FDBA74" stopOpacity="0.9" />
        </linearGradient>
        <filter
          id={`streak-soft-${id}`}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>

      {active && (
        <ellipse
          cx="32"
          cy="46"
          rx="17"
          ry="9"
          fill={`url(#streak-glow-${id})`}
          className="streak-glow-pulse"
        />
      )}

      {/* Outer flame body */}
      <path
        className={active ? "streak-flame-layer-outer" : undefined}
        d="M32 56c9.2-4.2 14.5-12.2 14.5-22.2C46.5 20.5 38.8 12.5 32 17.5c-2.8 4-6.8 6.8-9.6 11.2C17.8 36.2 19.2 47 26.2 52.8c2.3 1.9 4.1 2.5 5.8 3.2z"
        fill={`url(#streak-outer-${id})`}
        opacity={active ? 1 : 0.32}
      />

      {/* Mid tongue — offset motion */}
      <path
        className={active ? "streak-flame-layer-mid" : undefined}
        d="M32 50c5.8-2.6 9.2-8.2 9.2-14.8C41.2 27 36.2 21.8 32 25c-1.8 2.8-4.4 4.8-6.2 8.1C22.8 38.2 24 45.2 28.4 49c1.3 1.1 2.4 1.4 3.6 1z"
        fill={`url(#streak-mid-${id})`}
        opacity={active ? 0.95 : 0.38}
      />

      {/* Hot core */}
      <path
        className={active ? "streak-flame-layer-core" : undefined}
        d="M32 46c2.8-1.8 4.6-4.8 4.6-8.4 0-2.8-1.5-5-4.6-6.5-1.2 2-2.5 3.4-3.2 5.4-.8 2.4-.1 5.2 2 7.1.9.8 1.8 1.5 3.2 2.4z"
        fill={`url(#streak-core-${id})`}
        opacity={active ? 0.98 : 0.4}
      />

      {active && (
        <>
          <circle
            cx="26"
            cy="22"
            r="1.4"
            fill="#FEF3C7"
            className="streak-ember streak-ember-a"
            filter={`url(#streak-soft-${id})`}
          />
          <circle
            cx="38"
            cy="18"
            r="1.1"
            fill="#FDE68A"
            className="streak-ember streak-ember-b"
            filter={`url(#streak-soft-${id})`}
          />
          <circle
            cx="30"
            cy="14"
            r="0.9"
            fill="#FFF7ED"
            className="streak-ember streak-ember-c"
            filter={`url(#streak-soft-${id})`}
          />
        </>
      )}
    </svg>
  );
}
