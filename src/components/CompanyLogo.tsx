export function CompanyLogo({
  ticker,
  color,
  size = 28,
}: {
  ticker: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.32,
      }}
    >
      {ticker.slice(0, 2)}
    </div>
  );
}
