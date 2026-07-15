"use client";

import type { ReactNode } from "react";

interface LandingPhoneFrameProps {
  children: ReactNode;
  className?: string;
  /** Compact size for feature cards */
  compact?: boolean;
}

export function LandingPhoneFrame({
  children,
  className = "",
  compact = false,
}: LandingPhoneFrameProps) {
  const sizeClass = compact
    ? "h-[220px] w-[110px] sm:h-[260px] sm:w-[130px]"
    : "h-[340px] w-[170px] shrink-0 sm:h-[480px] sm:w-[240px] md:h-[520px] md:w-[260px]";

  return (
    <div
      className={`relative ${sizeClass} drop-shadow-[0_24px_64px_rgba(0,0,0,0.55)] ${className}`}
      data-landing-phone
    >
      <svg
        viewBox="0 0 270 550"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <rect
          x="1"
          y="1"
          width="268"
          height="548"
          rx="44"
          fill="#000000"
          stroke="#374151"
          strokeWidth="2"
        />
        <rect x="14" y="14" width="242" height="522" rx="34" fill="#0a0a0a" />
        <rect
          x="98"
          y="22"
          width="74"
          height="22"
          rx="11"
          fill="#111111"
          stroke="#1f1f1f"
          strokeWidth="1"
        />
      </svg>

      <div className="absolute inset-[14px] flex flex-col overflow-hidden rounded-[34px] bg-pocket-bg text-pocket-text">
        {children}
      </div>
    </div>
  );
}
