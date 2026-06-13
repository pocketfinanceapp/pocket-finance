"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { getArticleBodyPreview, getArticleSubheading } from "@/lib/articlePreview";
import { hasUsableFeedImage } from "@/lib/feedImage";
import type { NewsArticle } from "@/lib/types";
import { formatCount, timeAgo } from "@/lib/utils";
import { MarketBadge } from "./MarketBadge";
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
import {
  getArticleDisplayTicker,
  resolveMarketForArticle,
} from "@/lib/tickerMap";
interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  isFirstCard?: boolean;
  showTrendingLabel?: boolean;
  onOpenComments: () => void;
  commentRefreshKey?: number;
}

const CARD_OVERLAY =
  "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.92) 100%)";

export function FeedCard({
  article,
  active,
  isFirstCard = false,
  showTrendingLabel = false,
  onOpenComments,
  commentRefreshKey = 0,
}: FeedCardProps) {
  const {
    saveArticle,
    unsaveArticle,
    isArticleSaved,
  } = useApp();
  const { user, isGuest, requestSignIn } = useAuth();
  const { liked, likeCount, toggleLike } = useArticleLikes(article);

  const usableInitial = hasUsableFeedImage(article.imageUrl);
  const [showImage, setShowImage] = useState(usableInitial);
  const [imgSrc, setImgSrc] = useState(usableInitial ? article.imageUrl : "");
  const saved = isArticleSaved(article.id);
  const [commentCount, setCommentCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [guestPrompt, setGuestPrompt] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [swipeHintOpacity, setSwipeHintOpacity] = useState(0);
  const displayTicker = getArticleDisplayTicker(article);
  const displayMarket = resolveMarketForArticle({
    ticker: article.ticker,
    sourceName: article.sourceName,
    sourceId: article.sourceId,
  });
  const isFallbackCard = !(showImage && imgSrc);
  const displaySubheading = getArticleSubheading(article.subheading);
  const bodyPreview = getArticleBodyPreview(article);
  const previewClassName =
    "line-clamp-3 text-[14px] leading-snug text-[#9ca3af]/90";

  useEffect(() => {
    const usable = hasUsableFeedImage(article.imageUrl);
    setShowImage(usable);
    setImgSrc(usable ? article.imageUrl : "");
  }, [article.id, article.imageUrl]);

  useEffect(() => {
    if (!active) return;
    void fetchCommentCount(article.id).then((count) => {
      setCommentCount(Number.isFinite(count) && count > 0 ? count : 0);
    });
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

      const fadeTimer = window.setTimeout(() => setSwipeHintOpacity(0), 2500);
      const hideTimer = window.setTimeout(() => {
        setShowSwipeHint(false);
        markSwipeHintSeen();
      }, 3100);

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

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      {showImage && imgSrc ? (
        <>
          <Image
            src={imgSrc}
            alt=""
            fill
            className="absolute inset-0 h-full w-full object-cover brightness-[0.92] contrast-[1.05]"
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
        <>
          <FeedCardFallbackBackground />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 pb-36 pt-20">
            <h1 className="line-clamp-4 text-center text-[1.85rem] font-bold leading-[1.2] tracking-tight text-white">
              {cleanArticleTitle(article.headline)}
            </h1>
            {bodyPreview ? (
              <p className={`mt-4 max-w-md text-center ${previewClassName}`}>
                {bodyPreview}
              </p>
            ) : null}
          </div>
        </>
      )}

      <aside
        className="absolute bottom-4 right-4 z-30 flex flex-col items-center gap-5"
        data-no-drag
        data-interactive
      >
        <ActionButton
          label={liked ? "Unlike" : "Like"}
          onClick={() =>
            guardGuestAction("Sign in to like this", () => void toggleLike())
          }
        >
          <Heart
            className={`h-[26px] w-[26px] transition-colors ${
              liked ? "fill-red-500 text-red-500" : "text-white"
            }`}
          />
          {likeCount > 0 ? (
            <span className="text-[11px] font-semibold text-white/90">
              {formatCount(likeCount)}
            </span>
          ) : null}
        </ActionButton>

        <ActionButton
          label="Comment"
          onClick={() =>
            guardGuestAction("Sign in to comment", onOpenComments)
          }
        >
          <MessageCircle className="h-[26px] w-[26px] text-white" />
          {commentCount > 0 ? (
            <span className="text-[11px] font-semibold text-white/90">
              {formatCount(commentCount)}
            </span>
          ) : null}
        </ActionButton>

        <ActionButton
          label="Share"
          iconOnly
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
          <Share2 className="h-[25px] w-[25px] text-white" />
        </ActionButton>

        <ActionButton
          label={saved ? "Unsave" : "Save"}
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
            className={`h-[25px] w-[25px] transition-colors ${
              saved ? "fill-white text-white" : "text-white"
            }`}
          />
          <span className="text-[11px] font-semibold text-white/90">Save</span>
        </ActionButton>
      </aside>

      <div
        className="z-20"
        style={{
          position: "absolute",
          bottom: "16px",
          left: 0,
          right: 0,
          padding: "0 80px 0 20px",
        }}
      >
        {!isFallbackCard && (
          <h1 className="line-clamp-3 text-[1.55rem] font-bold leading-[1.2] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
            {cleanArticleTitle(article.headline)}
          </h1>
        )}
        {displaySubheading ? (
          <p
            className={`line-clamp-2 text-[14px] leading-snug ${
              isFallbackCard ? "mt-0 text-white/70" : "mt-2 text-white/70"
            }`}
          >
            {displaySubheading}
          </p>
        ) : null}

        {!isFallbackCard && bodyPreview ? (
          <p className={`mt-2 ${previewClassName}`}>{bodyPreview}</p>
        ) : null}

        <div className={`flex flex-wrap items-center gap-2 ${isFallbackCard ? "mt-2" : "mt-3"}`}>
          <MarketBadge market={displayMarket} size="sm" />
          {showTrendingLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-semibold text-orange-300">
              🔥 Trending
            </span>
          )}
        </div>

        {showSwipeHint && (
          <div
            className="mt-3 flex justify-center gap-2 transition-opacity duration-500 ease-out"
            style={{ opacity: swipeHintOpacity }}
            data-no-drag
          >
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
              ← Article
            </span>
            <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
              Stock →
            </span>
          </div>
        )}

        <div className="mt-2.5">
          <SourceBadge
            sourceName={article.sourceName}
            sourceId={article.sourceId}
            sourceUrl={article.sourceUrl}
            publishedAt={article.publishedAt}
            timeLabel={timeAgo(article.publishedAt)}
          />
        </div>

        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-md">
          <svg className="h-3 w-3 text-pocket-teal" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 17 L8 12 L12 15 L16 8 L21 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {displayTicker}
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

function ActionButton({
  children,
  label,
  onClick,
  iconOnly = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  iconOnly?: boolean;
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
      className={`rounded-lg p-2 text-white transition-transform active:scale-90 ${
        iconOnly
          ? "flex items-center justify-center"
          : "flex flex-col items-center gap-1.5"
      }`}
      style={{ touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}
