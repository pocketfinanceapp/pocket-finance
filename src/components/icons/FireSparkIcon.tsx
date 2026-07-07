"use client";

export function FireSparkIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      style={{ filter: "drop-shadow(0 0 6px rgba(251,146,60,0.25))" }}
    >
      <path
        d="M12.2 3.5c.8 2.2.1 3.9-1.6 5.6-1 1-1.7 2.1-1.7 3.7 0 2.4 1.9 4.2 4.3 4.2s4.3-1.8 4.3-4.2c0-1.8-.9-3.1-2.2-4.4-.9-.9-1.6-1.8-1.4-3.3 2 1.3 3.8 3.7 3.8 6.9 0 4-3 6.8-6.9 6.8s-6.9-2.8-6.9-6.6c0-3.7 2.5-6.4 5.3-8 0 1.7.9 2.8 2 3.9.8-.8 1.2-2 .9-4.6z"
        fill="url(#pf-fire-main)"
      />
      <path
        d="M12 9.6c.8 1.1.7 2-.1 3-.5.5-.8 1.1-.8 1.9 0 1.3 1 2.3 2.3 2.3 1.4 0 2.4-1 2.4-2.3 0-1.2-.6-2.1-1.5-2.9-.5-.4-.9-.9-.9-2z"
        fill="url(#pf-fire-core)"
        style={{ animation: "pf-fire-flicker 1.3s ease-in-out infinite" }}
      />
      <defs>
        <linearGradient id="pf-fire-main" x1="4" y1="20" x2="18" y2="4">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="pf-fire-core" x1="10" y1="17" x2="15" y2="10">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
      </defs>
    </svg>
  );
}
