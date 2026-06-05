"use client";

import { useId } from "react";

const BLUE = "#3B6EF5";
const TEAL = "#00C6C6";

interface PocketMarkIconProps {
  size?: number;
  className?: string;
  /** Glow intensity — use "none" for sharp/crisp marks */
  glow?: "none" | "normal" | "strong" | "hero";
}

/** Stylised P with rising chart bars inside the bowl */
export function PocketMarkIcon({
  size = 32,
  className = "",
  glow = "normal",
}: PocketMarkIconProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `pocket-grad-${uid}`;
  const glowId = `pocket-glow-${uid}`;
  const useGlow = glow !== "none";
  const blur = glow === "hero" ? 11 : glow === "strong" ? 6 : 3.5;

  const mark = (
    <>
      <path
        d="M22 14V86M22 14H50C72 14 80 28 80 46C80 64 70 78 48 78H34"
        stroke={`url(#${gradId})`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="52" y="60" width="6" height="12" rx="1.5" fill={`url(#${gradId})`} />
      <rect x="61" y="52" width="6" height="20" rx="1.5" fill={`url(#${gradId})`} />
      <rect x="70" y="42" width="6" height="30" rx="1.5" fill={`url(#${gradId})`} />
    </>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={TEAL} />
        </linearGradient>
        {useGlow && (
          <filter
            id={glowId}
            x={glow === "hero" ? "-80%" : "-40%"}
            y={glow === "hero" ? "-80%" : "-40%"}
            width={glow === "hero" ? "260%" : "180%"}
            height={glow === "hero" ? "260%" : "180%"}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation={blur} result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values={
                glow === "hero"
                  ? "0 0 0 0 0.2  0 0 0 0 0.65  0 0 0 0 0.95  0 0 0 1 0"
                  : "0 0 0 0 0.15  0 0 0 0 0.55  0 0 0 0 0.85  0 0 0 0.85 0"
              }
              result="glowColor"
            />
            <feMerge>
              <feMergeNode in="glowColor" />
              <feMergeNode in="glowColor" />
              <feMergeNode in="glowColor" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g filter={useGlow ? `url(#${glowId})` : undefined}>{mark}</g>
    </svg>
  );
}

interface PocketBrandProps {
  /** Icon dimension in px */
  iconSize?: number;
  layout?: "horizontal" | "vertical" | "icon";
  glow?: "none" | "normal" | "strong";
  showTagline?: boolean;
  className?: string;
  wordmarkClassName?: string;
}

/** Full Pocket Finance brand lockup */
export function PocketBrand({
  iconSize = 40,
  layout = "horizontal",
  glow = "normal",
  showTagline = false,
  className = "",
  wordmarkClassName = "",
}: PocketBrandProps) {
  const isVertical = layout === "vertical";
  const isIconOnly = layout === "icon";

  if (isIconOnly) {
    return (
      <PocketMarkIcon size={iconSize} glow={glow} className={className} />
    );
  }

  return (
    <div
      className={`flex items-center gap-3 ${
        isVertical ? "flex-col text-center" : "flex-row"
      } ${className}`}
    >
      <PocketMarkIcon size={iconSize} glow={glow} />
      <div className={isVertical ? "flex flex-col items-center" : ""}>
        <span
          className={`font-bold tracking-tight text-white ${
            iconSize >= 64
              ? "text-2xl"
              : iconSize >= 44
                ? "text-lg"
                : "text-[15px] leading-none"
          } ${wordmarkClassName}`}
        >
          Pocket Finance
        </span>
        {showTagline && (
          <span
            className={`mt-1.5 bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text font-medium text-transparent ${
              iconSize >= 64 ? "text-sm" : "text-xs"
            }`}
          >
            Bold news. Smarter moves.
          </span>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use PocketMarkIcon — kept for existing imports */
export function PocketLogo({
  size = 32,
  glow = "normal",
}: {
  size?: number;
  glow?: "normal" | "strong";
}) {
  return <PocketMarkIcon size={size} glow={glow} />;
}

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `verified-grad-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
      aria-label="Verified"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={TEAL} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${gradId})`} />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Pocket Finance publisher row for feed & article */
export function PocketPublisherBadge({
  timeLabel,
  compact,
}: {
  timeLabel?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <PocketMarkIcon size={compact ? 22 : 26} glow="none" />
      <span
        className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}
      >
        Pocket Finance
      </span>
      <VerifiedBadge size={compact ? 14 : 16} />
      {timeLabel && (
        <span className="text-xs text-zinc-500">· {timeLabel}</span>
      )}
    </div>
  );
}
