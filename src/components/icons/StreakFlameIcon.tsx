interface StreakFlameIconProps {
  className?: string;
  size?: number;
}

export function StreakFlameIcon({ className = "", size = 22 }: StreakFlameIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="pf-flame-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="0.55" stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <path
        d="M12 21c3.5-2 5.5-5.2 5.5-9A5.5 5.5 0 0012 7c-1.2 1.8-2.5 2.8-3.5 4.2C7 13.2 7.2 16 9 18c1 1.2 2.2 2.2 3 3z"
        fill="url(#pf-flame-grad)"
        fillOpacity="0.95"
      />
      <path
        d="M12 17c1.2-.8 2-2.2 2-3.8 0-1.4-.8-2.5-2-3.2-.6.9-1.2 1.5-1.5 2.4-.4 1.1-.1 2.4.8 3.3.4.4.9.8 1.7 1.3z"
        fill="#FEF3C7"
        fillOpacity="0.9"
      />
    </svg>
  );
}
