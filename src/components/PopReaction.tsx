"use client";

import { useCallback, useState, type ReactNode } from "react";

const PARTICLE_COUNT = 8;

interface PopReactionProps {
  children: ReactNode;
  onClick?: () => void;
  /** Fire bounce + particles (typically when activating, not deactivating) */
  burst?: boolean;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  type?: "button" | "submit";
}

export function PopReaction({
  children,
  onClick,
  burst = true,
  className = "",
  disabled,
  "aria-label": ariaLabel,
  type = "button",
}: PopReactionProps) {
  const [popping, setPopping] = useState(false);
  const [particles, setParticles] = useState<
    { id: number; dx: number; dy: number; color: string }[]
  >([]);

  const triggerPop = useCallback(() => {
    if (!burst) return;
    setPopping(true);
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4;
        const dist = 14 + Math.random() * 16;
        return {
          id: Date.now() + i,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          color: i % 2 === 0 ? "#00C6C6" : "#3B6EF5",
        };
      })
    );
    window.setTimeout(() => {
      setPopping(false);
      setParticles([]);
    }, 560);
  }, [burst]);

  return (
    <button
      type={type}
      data-no-drag
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        triggerPop();
        onClick?.();
      }}
      className={`relative ${popping ? "pf-pop-bounce" : ""} ${className}`}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="pf-pop-particle"
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              backgroundColor: p.color,
            } as React.CSSProperties
          }
          aria-hidden
        />
      ))}
      {children}
    </button>
  );
}
