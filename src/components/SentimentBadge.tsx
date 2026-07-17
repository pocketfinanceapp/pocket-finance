"use client";

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
}

export function SentimentBadge({
  score,
  size = "sm",
  className = "",
}: SentimentBadgeProps) {
  if (typeof score !== "number" || Number.isNaN(score)) return null;

  const label = sentimentLabel(score);
  const { text, className: styleClass, Icon } = STYLES[label];
  const padding =
    size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  const iconSize = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${padding} ${styleClass} ${className}`}
      title={`Marketaux news sentiment score: ${score.toFixed(2)}`}
    >
      <Icon className={`${iconSize} shrink-0`} strokeWidth={2.5} />
      <span>{text}</span>
    </div>
  );
}
