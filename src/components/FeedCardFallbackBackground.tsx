"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { NewsArticle } from "@/lib/types";
import {
  resolveFeedFallbackVariant,
  type FeedFallbackVariant,
} from "@/lib/feedFallbackVariant";

interface FeedCardFallbackBackgroundProps {
  article: NewsArticle;
  category?: string;
}

// Shared across every card in the feed — there are only 6 categories, so
// this caps us at 6 network requests per session no matter how many cards
// scroll past, and instant reuse after the first hit per category.
const categoryImageCache = new Map<FeedFallbackVariant, string | null>();
const inFlightRequests = new Map<FeedFallbackVariant, Promise<string | null>>();

function loadCategoryImage(variant: FeedFallbackVariant): Promise<string | null> {
  if (categoryImageCache.has(variant)) {
    return Promise.resolve(categoryImageCache.get(variant) ?? null);
  }
  const existing = inFlightRequests.get(variant);
  if (existing) return existing;

  const request = fetch(`/api/fallback-image?category=${variant}`)
    .then((res) => (res.ok ? res.json() : { imageUrl: null }))
    .then((data: { imageUrl: string | null }) => {
      categoryImageCache.set(variant, data.imageUrl ?? null);
      return data.imageUrl ?? null;
    })
    .catch(() => {
      categoryImageCache.set(variant, null);
      return null;
    })
    .finally(() => {
      inFlightRequests.delete(variant);
    });

  inFlightRequests.set(variant, request);
  return request;
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

/** Category-specific fallback when an article has no usable image of its
 * own — a real, topic-relevant photo (e.g. a trading floor for finance
 * news) with the abstract art kept as an instant-render placeholder while
 * the photo loads, and as the permanent fallback if no photo is found. */
export function FeedCardFallbackBackground({
  article,
  category,
}: FeedCardFallbackBackgroundProps) {
  const variant = category
    ? resolveVariantFromCategory(category, article)
    : resolveFeedFallbackVariant(article);
  const uid = article.id.replace(/[^a-zA-Z0-9_-]/g, "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    () => categoryImageCache.get(variant) ?? null
  );

  useEffect(() => {
    let cancelled = false;
    void loadCategoryImage(variant).then((url) => {
      if (!cancelled) setPhotoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-pocket-feed-bg">
      <div className="pf-feed-fallback-art relative h-full w-full">
        <VariantArt variant={variant} uid={uid} />
      </div>
      {photoUrl && (
        <Image
          src={photoUrl}
          alt=""
          fill
          className="absolute inset-0 h-full w-full object-cover object-center opacity-90"
          sizes="100vw"
          unoptimized
        />
      )}
      <div className="pf-feed-fallback-scrim absolute inset-0" />
    </div>
  );
}

function FallbackBase({ variant }: { variant: FeedFallbackVariant }) {
  return (
    <div className={`pf-feed-fallback-base pf-feed-fallback-base--${variant}`} />
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

/*
 * None of these are charts. Earlier versions drew a single bold ascending
 * zig-zag "trend line" (and, for crypto, small rounded rectangles stacked
 * like candlesticks) as the centrepiece of every variant — visually
 * indistinguishable from a real price/candlestick chart at a glance, which
 * risks implying real price history this app never shows (there is no live
 * quote feed, by design). Replaced with abstract motifs — rings, nodes,
 * dots, arcs — that keep the category's visual identity without reading as
 * market data.
 */

function CryptoArt({ uid }: { uid: string }) {
  const nodes = [
    { x: 90, y: 190 },
    { x: 210, y: 150 },
    { x: 310, y: 230 },
    { x: 150, y: 300 },
    { x: 280, y: 350 },
    { x: 110, y: 400 },
  ];
  const links: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [0, 3],
    [2, 4],
    [3, 4],
    [3, 5],
  ];
  return (
    <>
      <FallbackBase variant="crypto" />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-80"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-crypto-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00C6C6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3B6EF5" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        {links.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={`url(#ff-crypto-${uid})`}
            strokeWidth="1.5"
          />
        ))}
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={i % 2 === 0 ? 9 : 6}
            fill="none"
            stroke="rgba(0,198,198,0.5)"
            strokeWidth="2"
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
        className="absolute inset-0 h-full w-full opacity-78"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-mining-${uid}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#C4915A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#E0B888" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {[480, 420, 360, 300, 240].map((y) => (
          <path
            key={y}
            d={`M0,${y} Q100,${y - 20} 200,${y} T400,${y}`}
            fill="none"
            stroke="rgba(196,145,90,0.28)"
            strokeWidth="1.5"
          />
        ))}
        {[100, 200, 300].map((x, i) => (
          <path
            key={x}
            d={`M${x},560 L${x - 34},460 L${x + 34},460 Z`}
            fill={`url(#ff-mining-${uid})`}
            stroke="rgba(224,184,136,0.3)"
            strokeWidth="1"
            opacity={0.85 - i * 0.12}
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
        className="absolute inset-0 h-full w-full opacity-78"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id={`ff-energy-${uid}`} cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FF8C28" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF8C28" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="220" r="180" fill={`url(#ff-energy-${uid})`} />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M0,${420 + i * 20} Q100,${396 + i * 14} 200,${420 + i * 20} T400,${420 + i * 20}`}
            fill="none"
            stroke={`rgba(255,150,50,${0.32 - i * 0.05})`}
            strokeWidth="2"
          />
        ))}
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
        className="absolute inset-0 h-full w-full opacity-80"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-finance-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00C6C6" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {[
          { cx: 130, cy: 210, r: 70 },
          { cx: 230, cy: 260, r: 52 },
          { cx: 175, cy: 330, r: 36 },
        ].map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            fill="none"
            stroke={`url(#ff-finance-${uid})`}
            strokeWidth="3"
          />
        ))}
        {[90, 150, 210, 270, 330].map((x, i) => (
          <circle
            key={`dot-${x}`}
            cx={x}
            cy={460 + (i % 2 === 0 ? 0 : 18)}
            r={4}
            fill="rgba(255,255,255,0.18)"
          />
        ))}
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
        className="absolute inset-0 h-full w-full opacity-80"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-tech-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8A64FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00C6C6" stopOpacity="0.35" />
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
              rx="8"
              fill="rgba(130,90,255,0.1)"
              stroke="rgba(130,90,255,0.32)"
              strokeWidth="1"
            />
          ))
        )}
        <circle cx="200" cy="230" r="14" fill={`url(#ff-tech-${uid})`} />
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
        className="absolute inset-0 h-full w-full opacity-78"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ff-markets-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#00C6C6" stopOpacity="0.42" />
          </linearGradient>
        </defs>
        {[80, 130, 180].map((r) => (
          <circle
            key={r}
            cx="80"
            cy="480"
            r={r}
            fill="none"
            stroke={`url(#ff-markets-${uid})`}
            strokeWidth="1.5"
          />
        ))}
        {[60, 110, 160].map((r) => (
          <circle
            key={`tr-${r}`}
            cx="340"
            cy="140"
            r={r}
            fill="none"
            stroke="rgba(0,198,198,0.18)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </>
  );
}
