import { Globe } from "lucide-react";

function logoLabel(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (upper === "SPX") return "SP";
  if (upper === "MARKET") return "";
  return upper.slice(0, 2);
}

export function CompanyLogo({
  ticker,
  color,
  size = 28,
  shape = "square",
}: {
  ticker: string;
  color: string;
  size?: number;
  shape?: "square" | "circle";
}) {
  const upper = ticker.toUpperCase();
  const showGlobe = upper === "MARKET";
  const label = logoLabel(upper);

  return (
    <div
      className={`flex shrink-0 items-center justify-center text-xs font-bold text-white ${
        shape === "circle" ? "rounded-full" : "rounded-md"
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.32,
      }}
    >
      {showGlobe ? (
        <Globe
          className="text-white"
          style={{ width: size * 0.5, height: size * 0.5 }}
          strokeWidth={2.25}
        />
      ) : (
        label
      )}
    </div>
  );
}
