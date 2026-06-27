"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LevelState } from "@/lib/progression";

const RING_R = 32;
const RING_C = 2 * Math.PI * RING_R;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

interface ProfileAvatarWithRingProps {
  initials: string;
  progression: LevelState;
  animateIn?: boolean;
}

/** Circular avatar with a bold full progress ring and level badge. */
export function ProfileAvatarWithRing({
  initials,
  progression,
  animateIn = true,
}: ProfileAvatarWithRingProps) {
  const gradId = useId().replace(/:/g, "");
  const targetOffset = RING_C * (1 - progression.progressPercent / 100);
  const [ringOffset, setRingOffset] = useState(animateIn ? RING_C : targetOffset);
  const [revealed, setRevealed] = useState(!animateIn);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!animateIn) {
      hasAnimated.current = false;
      setRingOffset(RING_C);
      setRevealed(false);
      return;
    }

    if (hasAnimated.current) {
      setRingOffset(targetOffset);
      setRevealed(true);
      return;
    }

    setRingOffset(RING_C);
    setRevealed(false);

    const revealTimer = window.setTimeout(() => setRevealed(true), 40);
    const ringTimer = window.setTimeout(() => {
      setRingOffset(targetOffset);
      hasAnimated.current = true;
    }, 80);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(ringTimer);
    };
  }, [animateIn, targetOffset]);

  useEffect(() => {
    if (!hasAnimated.current) return;
    setRingOffset(targetOffset);
  }, [targetOffset]);

  return (
    <div
      className="relative shrink-0"
      style={{
        width: 76,
        height: 76,
        opacity: revealed ? 1 : 0,
        transform: revealed ? "scale(1)" : "scale(0.88)",
        transition: `opacity 520ms ${EASE}, transform 680ms ${EASE}`,
      }}
    >
      <svg
        className="absolute inset-0 h-[76px] w-[76px] -rotate-90"
        viewBox="0 0 76 76"
        aria-hidden
      >
        <defs>
          <linearGradient id={`pf-avatar-ring-${gradId}`} x1="0" y1="0" x2="76" y2="76">
            <stop stopColor="#7C6CF8" />
            <stop offset="0.45" stopColor="#5B8EF0" />
            <stop offset="1" stopColor="#00C6C6" />
          </linearGradient>
          <filter id={`pf-avatar-ring-glow-${gradId}`}>
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Full background track */}
        <circle
          cx="38"
          cy="38"
          r={RING_R}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="5"
        />

        {/* XP progress — bold ring around entire avatar */}
        <circle
          cx="38"
          cy="38"
          r={RING_R}
          fill="none"
          stroke={`url(#pf-avatar-ring-${gradId})`}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={ringOffset}
          filter={`url(#pf-avatar-ring-glow-${gradId})`}
          style={{
            transition: `stroke-dashoffset 1100ms ${EASE}`,
          }}
        />
      </svg>

      <div
        className="absolute left-1/2 top-1/2 flex h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[22px] font-bold text-white"
        style={{
          background:
            "linear-gradient(145deg, rgba(59,110,245,0.82) 0%, rgba(0,198,198,0.52) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 16px rgba(0,0,0,0.35)",
        }}
      >
        {initials}
      </div>

      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
        style={{
          background: "linear-gradient(135deg, #7C6CF8 0%, #5B8EF0 55%, #00C6C6 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
          opacity: revealed ? 1 : 0,
          transform: revealed ? "scale(1)" : "scale(0.6)",
          transition: `opacity 400ms ${EASE} 420ms, transform 520ms ${EASE} 420ms`,
        }}
      >
        {progression.level}
      </span>
    </div>
  );
}
