"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { getArticleContextLine } from "@/lib/articlePreview";
import { hasUsableFeedImage } from "@/lib/feedImage";
import type { NewsArticle, Sector } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { FeedCardFallbackBackground } from "./FeedCardFallbackBackground";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { SourceBadge } from "./SourceBadge";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useArticleLikes } from "@/hooks/useArticleLikes";
import {
  hasSeenSwipeHint,
  isFeedOnboardingComplete,
  markSwipeHintSeen,
} from "@/lib/feedOnboarding";
import { resolveMarketForArticle } from "@/lib/tickerMap";
import { isUsListedStockTicker } from "@/lib/usStockTickers";

interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  isFirstCard?: boolean;
  showTrendingLabel?: boolean;
  onOpenComments: () => void;
  commentRefreshKey?: number;
}

const GENERIC_SYMBOLS = new Set([
  "MARKET",
  "SPX",
  "QQQ",
  "DJI",
  "OIL",
  "GOLD",
  "FED",
]);

const SECTOR_TAGS: Record<Sector, string> = {
  Technology: "TECH",
  Finance: "FINANCE",
  Energy: "ENERGY",
  Mining: "MINING",
  Healthcare: "HEALTH",
  Consumer: "CONSUMER",
  Crypto: "CRYPTO",
  "Real Estate": "REAL ESTATE",
};

type ChipKind = "stock" | "topic";

function getCategoryTag(article: NewsArticle, displayMarket: string): string {
  const upperTags = article.tags.map((tag) => tag.toUpperCase());
  if (upperTags.includes("AI")) return "AI";

  if (article.market === "CRYPTO" || article.sector === "Crypto") return "CRYPTO";
  if (article.market === "COMMODITIES") return "COMMODITIES";
  if (displayMarket === "US MARKETS") return "US MARKETS";
  if (
    ["NASDAQ", "NYSE", "ASX", "LSE", "Nikkei", "HKEX"].includes(displayMarket)
  ) {
    return displayMarket;
  }
  return SECTOR_TAGS[article.sector] ?? displayMarket.toUpperCase();
}

function resolveFeedChip(
  article: NewsArticle,
  categoryTag: string
): { label: string; kind: ChipKind } {
  const candidates = [
    article.ticker?.trim().toUpperCase(),
    ...article.tags.map((tag) => tag.toUpperCase()),
  ].filter(Boolean) as string[];

  for (const symbol of candidates) {
    if (GENERIC_SYMBOLS.has(symbol)) continue;

    if (isUsListedStockTicker(symbol)) {
      return { label: symbol, kind: "stock" };
    }

    return { label: symbol, kind: "topic" };
  }

  return { label: categoryTag, kind: "topic" };
}

function FeedCardOverlays() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-32 bg-gradient-to-b from-black/75 via-black/40 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(135deg, rgba(59,110,245,0.16) 0%, transparent 42%, rgba(0,198,198,0.12) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.08) 18%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0.82) 58%, rgba(0,0,0,0.97) 100%)",
        }}
      />
    </>
  );
}

export function FeedCard({
  article,
  active,
  isFirstCard = false,
  showTrendingLabel = false,
  onOpenComments,
}: FeedCardProps) {
  const { saveArticle, unsaveArticle, isArticleSaved } = useApp();
  const { user, isGuest, requestSignIn } = useAuth();
  const { liked, toggleLike } = useArticleLikes(article);

  const usableInitial = hasUsableFeedImage(article.imageUrl);
  const [showImage, setShowImage] = useState(usableInitial);
  const [imgSrc, setImgSrc] = useState(usableInitial ? article.imageUrl : "");
  const saved = isArticleSaved(article.id);
  const [toast, setToast] = useState<string | null>(null);
  const [guestPrompt, setGuestPrompt] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [swipeHintOpacity, setSwipeHintOpacity] = useState(0);

  const displayMarket = resolveMarketForArticle({
    ticker: article.ticker,
    sourceName: article.sourceName,
    sourceId: article.sourceId,
  });
  const categoryTag = getCategoryTag(article, displayMarket);
  const feedChip = resolveFeedChip(article, categoryTag);
  const contextLine = getArticleContextLine(article);
  const hasHeroImage = showImage && !!imgSrc;

  useEffect(() => {
    const usable = hasUsableFeedImage(article.imageUrl);
    setShowImage(usable);
    setImgSrc(usable ? article.imageUrl : "");
  }, [article.id, article.imageUrl]);

  useEffect(() => {
    if (!isFirstCard || !active) {
      setShowSwipeHint(false);
      setSwipeHintOpacity(0);
      return;
    }

    const startHint = () => {
      if (!isFeedOnboardingComplete() || hasSeenSwipeHint()) return;

      setShowSwipeHint(true);
      setSwipeHintOpacity(1);

      const fadeTimer = window.setTimeout(() => setSwipeHintOpacity(0), 3200);
      const hideTimer = window.setTimeout(() => {
        setShowSwipeHint(false);
        markSwipeHintSeen();
      }, 3800);

      return () => {
        window.clearTimeout(fadeTimer);
        window.clearTimeout(hideTimer);
      };
    };

    let cleanup = startHint();
    const onOnboardingDismissed = () => {
      cleanup?.();
      cleanup = startHint();
    };

    window.addEventListener("pf-onboarding-dismissed", onOnboardingDismissed);

    return () => {
      cleanup?.();
      window.removeEventListener("pf-onboarding-dismissed", onOnboardingDismissed);
    };
  }, [isFirstCard, active]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  const promptGuestSignIn = useCallback((message: string) => {
    setGuestPrompt(message);
    window.setTimeout(() => setGuestPrompt(null), 3200);
  }, []);

  const guardGuestAction = useCallback(
    (message: string, action: () => void) => {
      if (isGuest && !user) {
        promptGuestSignIn(message);
        return;
      }
      action();
    },
    [isGuest, user, promptGuestSignIn]
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      {hasHeroImage ? (
        <>
          <Image
            src={imgSrc}
            alt=""
            fill
            className="absolute inset-0 h-full w-full object-cover brightness-[0.72] contrast-[1.02] saturate-[0.92]"
            sizes="100vw"
            unoptimized
            priority={active}
            onError={() => setShowImage(false)}
          />
          <FeedCardOverlays />
        </>
      ) : (
        <>
          <FeedCardFallbackBackground />
          <FeedCardOverlays />
        </>
      )}

      <aside
        className="absolute right-3 top-[38%] z-30 flex -translate-y-1/2 flex-col items-center gap-4 sm:right-4"
        data-no-drag
        data-interactive
      >
        <ActionButton
          label={liked ? "Unlike" : "Like"}
          active={liked}
          onClick={() =>
            guardGuestAction("Sign in to like this", () => void toggleLike())
          }
        >
          <Heart
            className={`h-[21px] w-[21px] transition-colors ${
              liked ? "fill-[#00C6C6] text-[#00C6C6]" : "text-white"
            }`}
            strokeWidth={2}
          />
        </ActionButton>

        <ActionButton
          label="Comment"
          onClick={() =>
            guardGuestAction("Sign in to comment", onOpenComments)
          }
        >
          <MessageCircle className="h-[21px] w-[21px] text-white" strokeWidth={2} />
        </ActionButton>

        <ActionButton
          label="Share"
          onClick={async () => {
            const payload = {
              title: article.headline,
              text: article.subheading,
              url: article.sourceUrl,
            };
            if (navigator.share) {
              try {
                await navigator.share(payload);
                return;
              } catch {
                /* cancelled */
              }
            }
            flash("Link copied to clipboard");
            void navigator.clipboard?.writeText(article.sourceUrl);
          }}
        >
          <Share2 className="h-[21px] w-[21px] text-white" strokeWidth={2} />
        </ActionButton>

        <ActionButton
          label={saved ? "Unsave" : "Save"}
          active={saved}
          onClick={() =>
            guardGuestAction("Sign in to save this", () => {
              void (async () => {
                if (saved) {
                  const ok = await unsaveArticle(article.id);
                  flash(ok ? "Removed from watchlist" : "Could not remove");
                } else {
                  const ok = await saveArticle(article);
                  flash(ok ? "Saved to watchlist" : "Could not save");
                }
              })();
            })
          }
        >
          <Bookmark
            className={`h-[21px] w-[21px] transition-colors ${
              saved ? "fill-[#00C6C6] text-[#00C6C6]" : "text-white"
            }`}
            strokeWidth={2}
          />
        </ActionButton>
      </aside>

      <div className="absolute inset-x-0 bottom-0 z-20">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.88) 38%, rgba(0,0,0,0.45) 62%, transparent 100%)",
          }}
        />

        <div
          className="relative px-5 pb-5 pt-10"
          style={{ paddingRight: "5.25rem" }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#00C6C6]">
              {categoryTag}
            </span>
            {showTrendingLabel && (
              <span className="text-[10px] font-semibold text-orange-300/90">
                🔥 Trending
              </span>
            )}
          </div>

          <h1 className="mt-2 line-clamp-3 text-[1.42rem] font-bold leading-[1.16] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.95)] sm:text-[1.5rem]">
            {cleanArticleTitle(article.headline)}
          </h1>

          {contextLine ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-white/68">
              {contextLine}
            </p>
          ) : null}

          <div className="mt-3">
            <SourceBadge
              sourceName={article.sourceName}
              sourceId={article.sourceId}
              sourceUrl={article.sourceUrl}
              publishedAt={article.publishedAt}
              timeLabel={timeAgo(article.publishedAt)}
              variant="inline"
            />
          </div>

          <FeedChip label={feedChip.label} kind={feedChip.kind} />

          {showSwipeHint && (
            <div
              className="mt-3 flex flex-col items-start gap-1.5 transition-opacity duration-500 ease-out sm:flex-row sm:items-center sm:gap-2"
              style={{ opacity: swipeHintOpacity }}
              data-no-drag
            >
              <span className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] text-white/85 backdrop-blur-sm">
                Swipe left for full article
              </span>
              <span className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[10px] text-white/85 backdrop-blur-sm">
                Swipe right for stock data
              </span>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 px-4 py-2 text-sm font-medium text-white backdrop-blur-md"
          data-no-drag
        >
          {toast}
        </div>
      )}

      {guestPrompt && (
        <div
          className="absolute bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/75 px-4 py-2 text-xs text-white backdrop-blur-md"
          data-no-drag
          data-interactive
        >
          <span>{guestPrompt}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setGuestPrompt(null);
              requestSignIn();
            }}
            className="font-semibold text-[#00C6C6] underline-offset-2 hover:underline"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
}

function FeedChip({ label, kind }: { label: string; kind: ChipKind }) {
  if (kind === "stock") {
    return (
      <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#00C6C6]/35 bg-[#00C6C6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#00C6C6] backdrop-blur-md">
        <svg
          className="h-3 w-3 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M3 17 L8 12 L12 15 L16 8 L21 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="truncate">{label}</span>
      </div>
    );
  }

  return (
    <div className="mt-2.5 inline-flex max-w-full items-center rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/78 backdrop-blur-md">
      <span className="truncate">{label}</span>
    </div>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  active = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      data-no-drag
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-transform active:scale-90 ${
        active
          ? "border-[#00C6C6]/40 bg-[#00C6C6]/12 shadow-[0_4px_20px_rgba(0,198,198,0.18)]"
          : "border-white/10 bg-black/40 shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
      }`}
      style={{ touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}
