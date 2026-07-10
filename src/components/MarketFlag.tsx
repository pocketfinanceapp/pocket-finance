"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getMarketFlagSrcWidth, getMarketFlagUrl } from "@/lib/marketFlags";

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
  const flagSize = Math.round(size * 0.88);

  useEffect(() => {
    setImageFailed(false);
  }, [code]);

  const radius =
    rounded === "xl" ? "rounded-xl" : rounded === "lg" ? "rounded-lg" : "rounded-md";

  if (imageFailed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center bg-[var(--pocket-surface-hover)] text-[10px] font-bold uppercase text-pocket-muted ${radius} ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {code}
      </div>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-[var(--pocket-surface-hover)] ${radius} ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={getMarketFlagUrl(code, getMarketFlagSrcWidth(flagSize))}
        alt=""
        width={flagSize}
        height={flagSize}
        className="h-full w-full object-cover"
        unoptimized
        onError={() => setImageFailed(true)}
      />
    </div>
  );
}
