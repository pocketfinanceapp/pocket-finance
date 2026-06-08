"use client";

import Image from "next/image";
import { useId } from "react";

const BLUE = "#3B6EF5";
const TEAL = "#00C6C6";

const LOGO_SRC = "/pocket-logo.png";

interface PocketMarkIconProps {
  size?: number;
  className?: string;
  /** Glow intensity — use "none" for sharp/crisp marks */
  glow?: "none" | "normal" | "strong" | "hero";
}

const glowClass: Record<NonNullable<PocketMarkIconProps["glow"]>, string> = {
  none: "",
  normal: "drop-shadow-[0_0_8px_rgba(59,110,245,0.35)]",
  strong: "drop-shadow-[0_0_14px_rgba(59,110,245,0.5)]",
  hero: "drop-shadow-[0_0_24px_rgba(0,198,198,0.45)] drop-shadow-[0_0_12px_rgba(59,110,245,0.55)]",
};

/** Clean white P — for brand-gradient fallback cards */
export function PocketGradientMark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-20 w-20 shrink-0 items-center justify-center ${className}`}
      style={{
        color: "#FFFFFF",
        fontSize: "72px",
        fontWeight: "800",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1,
        opacity: 1,
      }}
      aria-hidden
    >
      P
    </div>
  );
}

/** Pocket Finance mark — brand P logo */
export function PocketMarkIcon({
  size = 32,
  className = "",
  glow = "normal",
}: PocketMarkIconProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 object-contain mix-blend-screen ${glowClass[glow]} ${className}`}
      style={{ width: size, height: size, mixBlendMode: "screen" }}
      aria-hidden
    />
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
