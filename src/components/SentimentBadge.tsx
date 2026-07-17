"use client";

import { useState } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

/**
 * Marketaux's own NLP-derived sentiment score (-1 to +1) for an article or
 * entity. This is descriptive of the article's tone, not a claim about a
 * stock's price or performance — safe to show without the liability risk
 * of displaying live quotes.
 */
export type SentimentLabel = "bullish" | "bearish" | "neutral";

const BULLISH_THRESHOLD = 0.15;
const BEARISH_THRESHOLD = -0.15;

export function sentimentLabel(score: number): SentimentLabel {
  if (score >= BULLISH_THRESHOLD) return "bullish";
  if (score <= BEARISH_THRESHOLD) return "bearish";
  return "neutral";
}

const STYLES: Record<
  SentimentLabel,
  { text: string; className: string; Icon: typeof TrendingUp }
> = {
  bullish: {
    text: "Bullish tone",
    className: "border-[#00C6C6]/35 bg-[#00C6C6]/14 text-[#00C6C6]",
    Icon: TrendingUp,
  },
  bearish: {
    text: "Bearish tone",
    className: "border-red-400/35 bg-red-400/14 text-red-400",
    Icon: TrendingDown,
  },
  neutral: {
    text: "Neutral tone",
    className:
      "border-[var(--pocket-border)] bg-[var(--pocket-surface-hover)] text-pocket-muted",
    Icon: Minus,
  },
};

interface SentimentBadgeProps {
  /** Marketaux sentiment_score, -1 to +1. Renders nothing if undefined/null. */
  score?: number | null;
  size?: "xs" | "sm";
  className?: string;
  /**
   * Whether tapping the badge shows a brief explainer. Default true — the
   * native `title` tooltip below is desktop-hover-only and never reachable
   * on a touch device, so this is the actual explanation path on mobile.
   * Disable for read-only contexts (e.g. nested inside another button)
   * where a second tap target would conflict.
   */
  explainOnTap?: boolean;
}

const EXPLAINER_TEXT =
  "AI-derived sentiment from recent news coverage of this story — a read on tone, not investment advice.";

export function SentimentBadge({
  score,
  size = "sm",
  className = "",
  explainOnTap = true,
}: SentimentBadgeProps) {
  const [showExplainer, setShowExplainer] = useState(false);

  if (typeof score !== "number" || Number.isNaN(score)) return null;

  const label = sentimentLabel(score);
  const { text, className: styleClass, Icon } = STYLES[label];
  const padding =
    size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  const iconSize = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";

  const badge = (
    <div
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${padding} ${styleClass} ${className}`}
      title={`Marketaux news sentiment score: ${score.toFixed(2)}`}
    >
      <Icon className={`${iconSize} shrink-0`} strokeWidth={2.5} />
      <span>{text}</span>
    </div>
  );

  if (!explainOnTap) return badge;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        data-no-drag
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setShowExplainer((v) => !v);
          window.setTimeout(() => setShowExplainer(false), 3200);
        }}
        className="appearance-none bg-transparent p-0"
        aria-label={`${text} — tap to learn what this means`}
      >
        {badge}
      </button>
      {showExplainer && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-1.5 w-48 -translate-x-1/2 rounded-lg border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-2.5 py-2 text-[11px] font-normal leading-snug text-pocket-text shadow-lg"
        >
          {EXPLAINER_TEXT}
        </span>
      )}
    </span>
  );
}
