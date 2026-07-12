"use client";

import { useEffect, useState } from "react";
import { getMarketFlagEmoji, getMarketFlagPath } from "@/lib/marketFlags";

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
  const [imageFailed, setImageFailed] = useState(false);
  const code = countryCode.toLowerCase();

  useEffect(() => {
    setImageFailed(false);
  }, [code]);

  const radius =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  if (imageFailed) {
    const emoji = getMarketFlagEmoji(code);
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-[var(--pocket-surface-hover)] ${radius} ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
        title={code.toUpperCase()}
      >
        <span
          className="leading-none"
          style={{ fontSize: Math.round(size * 0.5), lineHeight: 1 }}
          role="img"
          aria-label={`${code} flag`}
        >
          {emoji}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[var(--pocket-surface-hover)] ${radius} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
      title={code.toUpperCase()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getMarketFlagPath(code)}
        alt=""
        width={size}
        height={size}
        className="block h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}
