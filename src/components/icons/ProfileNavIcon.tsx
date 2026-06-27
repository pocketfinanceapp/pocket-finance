interface ProfileNavIconProps {
  active?: boolean;
  level?: number;
}

/** Custom profile tab icon — avatar silhouette with optional level ring. */
export function ProfileNavIcon({ active = false, level }: ProfileNavIconProps) {
  const stroke = active ? "#00C6C6" : "rgba(255,255,255,0.45)";
  const headFill = active ? "rgba(59,110,245,0.35)" : "none";

  return (
    <span className="relative flex h-[26px] w-[26px] items-center justify-center">
      {level != null && level > 0 && (
        <svg
          className="absolute inset-0 h-[26px] w-[26px] -rotate-90"
          viewBox="0 0 26 26"
          aria-hidden
        >
          <circle
            cx="13"
            cy="13"
            r="11.5"
            fill="none"
            stroke={active ? "rgba(0,198,198,0.25)" : "rgba(255,255,255,0.08)"}
            strokeWidth="1.5"
          />
          {active && (
            <circle
              cx="13"
              cy="13"
              r="11.5"
              fill="none"
              stroke="url(#pf-profile-ring)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeDasharray="72"
              strokeDashoffset="18"
            />
          )}
          <defs>
            <linearGradient id="pf-profile-ring" x1="0" y1="0" x2="26" y2="26">
              <stop stopColor="#3B6EF5" />
              <stop offset="1" stopColor="#00C6C6" />
            </linearGradient>
          </defs>
        </svg>
      )}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="relative z-[1]"
      >
        <circle cx="12" cy="8.5" r="3.75" fill={headFill} stroke={stroke} strokeWidth="1.75" />
        <path
          d="M5.5 19.5c1.2-3.2 3.8-4.8 6.5-4.8s5.3 1.6 6.5 4.8"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {active && (
          <circle cx="18.5" cy="6" r="2.25" fill="#3B6EF5" stroke="#00C6C6" strokeWidth="0.75" />
        )}
      </svg>
    </span>
  );
}
