import { CompanyLogo } from "./CompanyLogo";

interface MarketBadgeProps {
  market: string;
  ticker: string;
  logoColor: string;
  size?: "sm" | "md";
}

/** Brand-gradient market label with company icon */
export function MarketBadge({
  market,
  ticker,
  logoColor,
  size = "md",
}: MarketBadgeProps) {
  const logoSize = size === "sm" ? 18 : 22;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#3B6EF5]/30 bg-gradient-to-r from-[#3B6EF5]/20 to-[#00C6C6]/15 px-2.5 py-1">
      <CompanyLogo ticker={ticker} color={logoColor} size={logoSize} />
      <span
        className={`bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text font-bold tracking-wide text-transparent ${
          size === "sm" ? "text-[10px]" : "text-xs"
        }`}
      >
        {market}
      </span>
    </div>
  );
}
