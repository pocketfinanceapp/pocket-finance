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
  /** Clean text on brand gradient — no pill/scrim backgrounds */
  onGradient?: boolean;
  /** Single-line compact row for feed cards */
  variant?: "default" | "inline";
}

export function SourceBadge({
  sourceName,
  sourceId,
  sourceUrl,
  publishedAt,
  timeLabel,
  size = "md",
  onGradient = false,
  variant = "default",
}: SourceBadgeProps) {
  const brand = resolveSourceBrand(sourceName, sourceId, sourceUrl);
  const [logoFailed, setLogoFailed] = useState(false);
  const avatarSize = variant === "inline" ? 22 : size === "sm" ? 28 : 36;

  if (variant === "inline") {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <div
          className="relative shrink-0 overflow-hidden rounded"
          style={{ width: avatarSize, height: avatarSize }}
        >
          <div
            className="flex h-full w-full items-center justify-center text-[8px] font-bold"
            style={{
              backgroundColor: brand.color,
              color: brand.textColor ?? "#ffffff",
            }}
          >
            {brand.abbr}
          </div>
        </div>
        <p className="truncate text-[13px] text-white/70">
          <span className="font-bold text-white">{brand.name}</span>
          <span className="text-white/45"> · </span>
          <time dateTime={publishedAt} suppressHydrationWarning>
            {timeLabel}
          </time>
        </p>
      </div>
    );
  }

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
            className="flex h-full w-full items-center justify-center text-[10px] font-bold"
            style={{
              backgroundColor: brand.color,
              color: brand.textColor ?? "#ffffff",
            }}
          >
            {brand.abbr}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p
          className={`truncate font-semibold text-white ${
            size === "sm" ? "text-xs" : "text-sm"
          } ${onGradient ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" : ""}`}
        >
          {brand.name}
        </p>
        <p
          className={`text-xs ${
            onGradient
              ? "text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
              : "text-white/50"
          }`}
        >
          <time dateTime={publishedAt} suppressHydrationWarning>
            {timeLabel}
          </time>
        </p>
      </div>
    </div>
  );
}
