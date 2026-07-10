interface ProfileNavIconProps {
  active?: boolean;
  level?: number;
}

/** Clean profile tab icon without decorative ring. */
export function ProfileNavIcon({ active = false, level }: ProfileNavIconProps) {
  const stroke = active ? "#00C6C6" : "var(--pocket-nav-inactive)";
  const headFill = active ? "rgba(59,110,245,0.22)" : "none";

  return (
    <span className="relative flex h-[26px] w-[26px] items-center justify-center">
      <svg
        width="26"
        height="26"
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
        {active && level != null && level > 0 && (
          <circle cx="18.5" cy="6" r="2.35" fill="#3B6EF5" stroke="#00C6C6" strokeWidth="0.75" />
        )}
      </svg>
    </span>
  );
}
