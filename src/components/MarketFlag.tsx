"use client";

import { getMarketFlagEmoji } from "@/lib/marketFlags";

interface MarketFlagProps {
  countryCode: string;
  size?: number;
  className?: string;
  rounded?: "xl" | "lg" | "md";
}

export function MarketFlag({
  countryCode,
  size = 40,
  className = "",
  rounded = "xl",
}: MarketFlagProps) {
  const code = countryCode.toLowerCase();
  const emoji = getMarketFlagEmoji(code);
  const fontSize = Math.round(size * 0.55);

  const radius =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-[var(--pocket-surface-hover)] ${radius} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
      title={code.toUpperCase()}
    >
      <span
        className="leading-none"
        style={{ fontSize, lineHeight: 1 }}
        role="img"
        aria-label={`${code} flag`}
      >
        {emoji}
      </span>
    </div>
  );
}
