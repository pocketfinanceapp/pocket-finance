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
import { fetchCommentCount } from "@/lib/userInteractions";
import { resolveMarketForArticle } from "@/lib/tickerMap";

interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  isFirstCard?: boolean;
  showTrendingLabel?: boolean;
  onOpenComments: () => void;
  commentRefreshKey?: number;
}

const CARD_OVERLAY =
  "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.02) 22%, rgba(0,0,0,0.35) 48%, rgba(0,0,0,0.78) 62%, rgba(0,0,0,0.96) 100%)";

const GENERIC_TICKERS = new Set([
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

function getCategoryTag(article: NewsArticle, displayMarket: string): string {
  if (article.market === "CRYPTO" || article.sector === "Crypto") return "CRYPTO";
  if (article.market === "COMMODITIES") return "COMMODITIES";
  if (displayMarket === "US MARKETS") return "MACRO";
  if (["NASDAQ", "NYSE", "ASX", "LSE", "Nikkei", "HKEX"].includes(displayMarket)) {
    return displayMarket;
  }
  return SECTOR_TAGS[article.sector] ?? displayMarket.toUpperCase();
}

function getBottomChipLabel(
  article: NewsArticle,
  categoryTag: string
): { label: string; showChartIcon: boolean } {
  const ticker = article.ticker?.trim().toUpperCase();
  if (ticker && !GENERIC_TICKERS.has(ticker)) {
    return { label: ticker, showChartIcon: true };
  }
  return { label: categoryTag, showChartIcon: false };
}

export function FeedCard({
  article,
  active,
  isFirstCard = false,
  showTrendingLabel = false,
  onOpenComments,
  commentRefreshKey = 0,
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
  const bottomChip = getBottomChipLabel(article, categoryTag);
  const contextLine = getArticleContextLine(article);
  const hasHeroImage = showImage && !!imgSrc;

  useEffect(() => {
    const usable = hasUsableFeedImage(article.imageUrl);
    setShowImage(usable);
    setImgSrc(usable ? article.imageUrl : "");
  }, [article.id, article.imageUrl]);

  useEffect(() => {
    if (!active) return;
    void fetchCommentCount(article.id);
  }, [active, article.id, commentRefreshKey]);

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
            className="absolute inset-0 h-full w-full object-cover brightness-[0.88] contrast-[1.05]"
            sizes="100vw"
            unoptimized
            priority={active}
            onError={() => setShowImage(false)}
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{ background: CARD_OVERLAY }}
          />
        </>
      ) : (
        <FeedCardFallbackBackground />
      )}

      <aside
        className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-3 z-30 flex flex-col items-center gap-3.5 sm:right-4 sm:gap-4"
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
            className={`h-[22px] w-[22px] transition-colors ${
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
          <MessageCircle className="h-[22px] w-[22px] text-white" strokeWidth={2} />
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
          <Share2 className="h-[22px] w-[22px] text-white" strokeWidth={2} />
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
            className={`h-[22px] w-[22px] transition-colors ${
              saved ? "fill-[#00C6C6] text-[#00C6C6]" : "text-white"
            }`}
            strokeWidth={2}
          />
        </ActionButton>
      </aside>

      <div
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 z-20 px-5 pb-1"
        style={{ paddingRight: "4.75rem" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-[#00C6C6]/30 bg-[#00C6C6]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#00C6C6]">
            {categoryTag}
          </span>
          {showTrendingLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-orange-300">
              🔥 Trending
            </span>
          )}
        </div>

        <h1 className="mt-2.5 line-clamp-3 text-[1.45rem] font-bold leading-[1.18] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)] sm:text-[1.55rem]">
          {cleanArticleTitle(article.headline)}
        </h1>

        {contextLine ? (
          <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-white/72">
            {contextLine}
          </p>
        ) : null}

        <div className="mt-2.5">
          <SourceBadge
            sourceName={article.sourceName}
            sourceId={article.sourceId}
            sourceUrl={article.sourceUrl}
            publishedAt={article.publishedAt}
            timeLabel={timeAgo(article.publishedAt)}
            variant="inline"
          />
        </div>

        <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#00C6C6]/25 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
          {bottomChip.showChartIcon ? (
            <svg
              className="h-3 w-3 shrink-0 text-[#00C6C6]"
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
          ) : null}
          <span className="truncate">{bottomChip.label}</span>
        </div>

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
      className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-transform active:scale-90 ${
        active
          ? "border-[#00C6C6]/35 bg-[#00C6C6]/10"
          : "border-white/10 bg-white/[0.08]"
      }`}
      style={{ touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}
