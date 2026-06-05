interface MarketBadgeProps {
  market: string;
  size?: "sm" | "md";
}

/** Brand-gradient market label — text only */
export function MarketBadge({ market, size = "md" }: MarketBadgeProps) {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text font-bold tracking-wide text-transparent ${
        size === "sm" ? "text-[10px]" : "text-xs"
      }`}
    >
      {market}
    </span>
  );
}
