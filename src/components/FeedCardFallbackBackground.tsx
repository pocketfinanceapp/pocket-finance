import type { NewsArticle } from "@/lib/types";
import {
  resolveFeedFallbackVariant,
  type FeedFallbackVariant,
} from "@/lib/feedFallbackVariant";

interface FeedCardFallbackBackgroundProps {
  article: NewsArticle;
  category?: string;
}

function resolveVariantFromCategory(
  category: string,
  article: NewsArticle
): FeedFallbackVariant {
  const upper = category.toUpperCase();

  if (
    upper.includes("CRYPTO") ||
    upper.includes("BITCOIN") ||
    upper.includes("BTC") ||
    upper.includes("ETH")
  ) {
    return "crypto";
  }
  if (upper === "AI" || upper.includes("TECH")) return "tech";
  if (upper.includes("MINING") || upper.includes("MATERIALS")) return "mining";
  if (
    upper.includes("ENERGY") ||
    upper.includes("COMMODIT") ||
    upper.includes("OIL")
  ) {
    return "energy";
  }
  if (upper.includes("FINANCE") || upper.includes("BANK")) return "finance";

  return resolveFeedFallbackVariant(article);
}

/** Premium category-specific fallback when an article has no usable image */
export function FeedCardFallbackBackground({
  article,
  category,
}: FeedCardFallbackBackgroundProps) {
  const variant = category
    ? resolveVariantFromCategory(category, article)
    : resolveFeedFallbackVariant(article);
  const uid = article.id.replace(/[^a-zA-Z0-9_-]/g, "");

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-pocket-feed-bg">
      <div className="pf-feed-fallback-art relative h-full w-full">
        <VariantArt variant={variant} uid={uid} />
      </div>
      <div className="pf-feed-fallback-scrim absolute inset-0" />
    </div>
  );
}

function VariantArt({
  variant,
  uid,
}: {
  variant: FeedFallbackVariant;
  uid: string;
}) {
  switch (variant) {
    case "crypto":
      return <CryptoArt uid={uid} />;
    case "mining":
      return <MiningArt uid={uid} />;
    case "energy":
      return <EnergyArt uid={uid} />;
    case "finance":
      return <FinanceArt uid={uid} />;
    case "tech":
      return <TechArt uid={uid} />;
    default:
      return <MarketsArt uid={uid} />;
  }
}

function FallbackBase({ variant }: { variant: FeedFallbackVariant }) {
  return (
    <div className={`pf-feed-fallback-base pf-feed-fallback-base--${variant}`} />
  );
}

function CryptoArt({ uid }: { uid: string }) {
  return (
    <>
      <FallbackBase variant="crypto" />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-75"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-crypto-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00C6C6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3B6EF5" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {[120, 200, 280, 360].map((y) =>
          [80, 160, 240, 320].map((x) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r="3"
              fill="rgba(0,198,198,0.35)"
            />
          ))
        )}
        {[
          "M80,200 L160,160 L240,220 L320,140",
          "M60,320 L140,280 L220,340 L300,260 L380,300",
          "M100,420 L180,380 L260,440 L340,360",
        ].map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={`url(#ff-crypto-${uid})`}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.85"
          />
        ))}
        {[140, 220, 300].map((x, i) => (
          <rect
            key={x}
            x={x - 18}
            y={100 + i * 28}
            width="36"
            height="18"
            rx="4"
            fill="none"
            stroke="rgba(0,198,198,0.25)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </>
  );
}

function MiningArt({ uid }: { uid: string }) {
  return (
    <>
      <FallbackBase variant="mining" />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-70"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-mining-${uid}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5A2B" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#C4A574" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {[480, 420, 360, 300, 240].map((y) => (
          <path
            key={y}
            d={`M0,${y} Q100,${y - 20} 200,${y} T400,${y}`}
            fill="none"
            stroke="rgba(139,90,43,0.22)"
            strokeWidth="1.5"
          />
        ))}
        <path
          d="M40,520 L120,380 L200,420 L280,320 L360,360 L400,300"
          fill="none"
          stroke={`url(#ff-mining-${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {[100, 200, 300].map((x) => (
          <path
            key={x}
            d={`M${x},600 L${x - 30},480 L${x + 30},480 Z`}
            fill="rgba(139,90,43,0.12)"
            stroke="rgba(196,165,116,0.2)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </>
  );
}

function EnergyArt({ uid }: { uid: string }) {
  return (
    <>
      <FallbackBase variant="energy" />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-72"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M0,${420 + i * 18} Q100,${400 + i * 12} 200,${420 + i * 18} T400,${420 + i * 18}`}
            fill="none"
            stroke={`rgba(255,140,40,${0.18 - i * 0.03})`}
            strokeWidth="2"
          />
        ))}
        <path
          d="M0,480 L60,440 L120,470 L180,400 L240,430 L300,360 L360,390 L400,350"
          fill="none"
          stroke="#FF8C28"
          strokeOpacity="0.55"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

function FinanceArt({ uid }: { uid: string }) {
  return (
    <>
      <FallbackBase variant="finance" />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-72"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-finance-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00C6C6" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {[120, 200, 280, 360].map((y) => (
          <line
            key={y}
            x1="40"
            y1={y}
            x2="360"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        {[100, 180, 260, 340].map((x) => (
          <line
            key={x}
            x1={x}
            y1="80"
            x2={x}
            y2="420"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}
        <path
          d="M40,400 L40,320 L100,280 L160,300 L220,220 L280,250 L340,180 L360,200"
          fill="none"
          stroke={`url(#ff-finance-${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

function TechArt({ uid }: { uid: string }) {
  return (
    <>
      <FallbackBase variant="tech" />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-74"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-tech-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7850FF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#00C6C6" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {[100, 170, 240, 310].map((y) =>
          [70, 150, 230, 310].map((x) => (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="52"
              height="36"
              rx="6"
              fill="rgba(120,80,255,0.08)"
              stroke="rgba(120,80,255,0.22)"
              strokeWidth="1"
            />
          ))
        )}
        <path
          d="M60,440 L140,360 L220,400 L300,300 L360,340"
          fill="none"
          stroke={`url(#ff-tech-${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}

function MarketsArt({ uid }: { uid: string }) {
  return (
    <>
      <FallbackBase variant="markets" />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-70"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-markets-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00C6C6" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {[80, 160, 240, 320, 400, 480].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="400"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        {[80, 160, 240, 320].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="600"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}
        <path
          d="M0,420 L0,380 L50,360 L100,390 L150,320 L200,340 L250,280 L300,300 L350,240 L400,260"
          fill="none"
          stroke={`url(#ff-markets-${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}
