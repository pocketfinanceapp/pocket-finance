"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveSourceBrand } from "@/lib/sourceBranding";

interface SourceBadgeProps {
  sourceName: string;
  sourceId?: string | null;
  sourceUrl?: string;
  publishedAt: string;
  timeLabel: string;
  size?: "sm" | "md";
}

export function SourceBadge({
  sourceName,
  sourceId,
  sourceUrl,
  publishedAt,
  timeLabel,
  size = "md",
}: SourceBadgeProps) {
  const brand = resolveSourceBrand(sourceName, sourceId, sourceUrl);
  const [logoFailed, setLogoFailed] = useState(false);
  const avatarSize = size === "sm" ? 28 : 36;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative shrink-0 overflow-hidden rounded-md"
        style={{ width: avatarSize, height: avatarSize }}
      >
        {brand.logoUrl && !logoFailed ? (
          <Image
            src={brand.logoUrl}
            alt=""
            width={avatarSize}
            height={avatarSize}
            className="h-full w-full object-cover"
            unoptimized
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: brand.color }}
          >
            {brand.abbr}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p
          className={`truncate font-semibold text-white ${
            size === "sm" ? "text-xs" : "text-sm"
          }`}
        >
          {brand.name}
        </p>
        <p className="text-xs text-white/50">
          <time dateTime={publishedAt}>{timeLabel}</time>
        </p>
      </div>
    </div>
  );
}
