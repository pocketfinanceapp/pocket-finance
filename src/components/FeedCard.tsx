"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { getArticleContextLine } from "@/lib/articlePreview";
import { getFeedCategoryTag } from "@/lib/feedCategory";
import { estimateImageIsDark, hasUsableFeedImage } from "@/lib/feedImage";
import { isInteractiveTarget } from "@/lib/gesture";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { FeedCardFallbackBackground } from "./FeedCardFallbackBackground";
import { PopReaction } from "./PopReaction";
import { SourceBadge } from "./SourceBadge";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useArticleLikes } from "@/hooks/useArticleLikes";
import { useArticleCommentCount } from "@/hooks/useArticleCommentCount";
import {
  hasSeenSwipeHintThisSession,
  markSwipeHintSeen,
} from "@/lib/feedOnboarding";
import { resolveFeedChip } from "@/lib/feedChip";
import { resolveMarketForArticle } from "@/lib/tickerMap";
import { FireSparkIcon } from "@/components/icons/FireSparkIcon";

interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  showBottomChrome?: boolean;
  isFirstCard?: boolean;
  showTrendingLabel?: boolean;
  onOpenComments: () => void;
  commentRefreshKey?: number;
  overlayVisible?: boolean;
  overlayHomeReady?: boolean;
}

const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_SLOP = 28;

function FeedCardOverlays({ soft = false }: { soft?: boolean }) {
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-[1] h-16 ${
          soft ? "pf-feed-overlay-top--soft" : "pf-feed-overlay-top"
        }`}
      />
      <div
        className="pf-feed-overlay-tint pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light"
        style={{
          background: soft
            ? "linear-gradient(135deg, rgba(59,110,245,0.12) 0%, transparent 42%, rgba(0,198,198,0.08) 100%)"
            : "linear-gradient(135deg, rgba(59,110,245,0.16) 0%, transparent 42%, rgba(0,198,198,0.12) 100%)",
        }}
      />
      <div
        className={`pointer-events-none absolute inset-0 z-[1] ${
          soft ? "pf-feed-overlay-body--soft" : "pf-feed-overlay-body"
        }`}
      />
    </>
  );
}

export function FeedCard({
  article,
  active,
  showBottomChrome = true,
  isFirstCard = false,
  showTrendingLabel = false,
  onOpenComments,
  commentRefreshKey = 0,
  overlayVisible = true,
  overlayHomeReady = true,
}: FeedCardProps) {
  const { saveArticle, unsaveArticle, isArticleSaved } = useApp();
  const { user, isGuest, requestSignIn } = useAuth();
  const { liked, likeCount, toggleLike, likeOnly } = useArticleLikes(article);
  const commentCount = useArticleCommentCount(article.id, commentRefreshKey);

  const [imageFailed, setImageFailed] = useState(false);
  const saved = isArticleSaved(article.id);
  const [toast, setToast] = useState<string | null>(null);
  const [guestPrompt, setGuestPrompt] = useState<string | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [swipeHintOpacity, setSwipeHintOpacity] = useState(0);
  const [isDarkImage, setIsDarkImage] = useState(false);
  const [heartBursts, setHeartBursts] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);

  const displayMarket = resolveMarketForArticle({
    ticker: article.ticker,
    sourceName: article.sourceName,
    sourceId: article.sourceId,
  });
  const categoryTag = getFeedCategoryTag(article, displayMarket);
  const feedChip = resolveFeedChip(article, categoryTag);
  const contextLine = getArticleContextLine(article);
  const showFallback = !hasUsableFeedImage(article.imageUrl) || imageFailed;
  const hasHeroImage = !showFallback;
  const useSoftOverlay = hasHeroImage && isDarkImage;
  const iconClass =
    "pf-feed-rail-icon h-[26px] w-[26px] opacity-100";
  const hotHeadline =
    showTrendingLabel || likeCount + commentCount >= 35;

  useEffect(() => {
    setImageFailed(false);
    setIsDarkImage(false);
  }, [article.id, article.imageUrl]);

  useEffect(() => {
    if (!hasUsableFeedImage(article.imageUrl) || !article.imageUrl) return;

    let cancelled = false;
    void estimateImageIsDark(article.imageUrl).then((dark) => {
      if (cancelled) return;
      setIsDarkImage(dark);
      if (dark) setImageFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [article.id, article.imageUrl]);

  useEffect(() => {
    if (!isFirstCard || !active) {
      setShowSwipeHint(false);
      setSwipeHintOpacity(0);
      return;
    }

    if (hasSeenSwipeHintThisSession()) return;

    setShowSwipeHint(true);
    setSwipeHintOpacity(0.82);

    const fadeTimer = window.setTimeout(() => setSwipeHintOpacity(0), 4200);
    const hideTimer = window.setTimeout(() => {
      setShowSwipeHint(false);
      markSwipeHintSeen();
    }, 4800);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
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

  const spawnHeartBurst = useCallback(
    (clientX: number, clientY: number, container: HTMLElement) => {
      const rect = container.getBoundingClientRect();
      const id = Date.now() + Math.random();
      setHeartBursts((prev) => [
        ...prev,
        { id, x: clientX - rect.left, y: clientY - rect.top },
      ]);
      window.setTimeout(() => {
        setHeartBursts((prev) => prev.filter((burst) => burst.id !== id));
      }, 720);
    },
    []
  );

  const handleDoubleTapLike = useCallback(
    async (clientX: number, clientY: number, container: HTMLElement) => {
      spawnHeartBurst(clientX, clientY, container);

      if (isGuest && !user) {
        promptGuestSignIn("Sign in to like this");
        return;
      }

      if (!liked) {
        await likeOnly();
      }
    },
    [isGuest, user, liked, likeOnly, promptGuestSignIn, spawnHeartBurst]
  );

  const registerTap = useCallback(
    (
      e: React.TouchEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
      clientX: number,
      clientY: number
    ) => {
      if (!active) return;
      if (isInteractiveTarget(e.target)) return;

      const now = Date.now();
      const last = lastTapRef.current;

      if (
        last &&
        now - last.t <= DOUBLE_TAP_MS &&
        Math.hypot(clientX - last.x, clientY - last.y) <= DOUBLE_TAP_SLOP
      ) {
        e.preventDefault();
        lastTapRef.current = null;
        void handleDoubleTapLike(clientX, clientY, e.currentTarget);
        return;
      }

      lastTapRef.current = { t: now, x: clientX, y: clientY };
    },
    [active, handleDoubleTapLike]
  );

  return (
    <div
      className="pf-on-media relative h-full w-full overflow-hidden bg-pocket-feed-bg"
      data-feed-tap-area
      style={{ touchAction: "manipulation" }}
      onTouchEnd={(e) => {
        const touch = e.changedTouches[0];
        if (!touch) return;
        registerTap(e, touch.clientX, touch.clientY);
      }}
      onPointerUp={(e) => {
        if (e.pointerType === "touch") return;
        registerTap(e, e.clientX, e.clientY);
      }}
    >
      {hasHeroImage ? (
        <>
          <Image
            src={article.imageUrl}
            alt=""
            fill
            className={`absolute inset-0 h-full w-full object-cover object-top ${
              useSoftOverlay ? "pf-feed-hero-image--soft" : "pf-feed-hero-image"
            }`}
            sizes="100vw"
            unoptimized
            priority={active}
            onError={() => setImageFailed(true)}
          />
          <FeedCardOverlays soft={useSoftOverlay} />
        </>
      ) : (
        <>
          <FeedCardFallbackBackground article={article} category={categoryTag} />
          <FeedCardOverlays />
        </>
      )}

      {heartBursts.map((burst) => (
        <div
          key={burst.id}
          className="pointer-events-none absolute z-40 animate-heart-burst"
          style={{ left: burst.x, top: burst.y }}
          aria-hidden
        >
          <Heart
            className="h-14 w-14 fill-[#00C6C6]/75 text-[#00C6C6] drop-shadow-[0_4px_16px_rgba(0,198,198,0.35)]"
            strokeWidth={1.5}
          />
        </div>
      ))}

      <aside
        className="absolute right-3 top-[46%] z-30 flex -translate-y-1/2 flex-col items-center gap-5 sm:right-4"
        data-no-drag
        data-interactive
      >
        <RailActionSlot
          meta={
            likeCount > 0 ? (
              <span className="pf-feed-rail-meta text-[11px] font-bold tabular-nums leading-none">
                {formatLikeCount(likeCount)}
              </span>
            ) : null
          }
        >
          <PopReaction
            aria-label={liked ? "Unlike" : "Like"}
            burst={!liked}
            onClick={() =>
              guardGuestAction("Sign in to like this", () => void toggleLike())
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center transition-transform active:scale-90"
          >
            <Heart
              className={`${iconClass} transition-colors ${
                liked ? "fill-[#00C6C6] text-[#00C6C6]" : ""
              }`}
              strokeWidth={2.25}
            />
          </PopReaction>
        </RailActionSlot>

        <RailActionSlot
          meta={
            commentCount > 0 ? (
              <span className="pf-feed-rail-meta text-[11px] font-bold tabular-nums leading-none">
                {formatLikeCount(commentCount)}
              </span>
            ) : null
          }
        >
          <RailAction
            label="Comment"
            onClick={() =>
              guardGuestAction("Sign in to comment", onOpenComments)
            }
          >
            <MessageCircle className={iconClass} strokeWidth={2.25} />
          </RailAction>
        </RailActionSlot>

        <RailActionSlot>
          <RailAction
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
            <Share2 className={iconClass} strokeWidth={2.25} />
          </RailAction>
        </RailActionSlot>

        <RailActionSlot>
          <RailAction
            label={saved ? "Unsave" : "Save"}
            onClick={() =>
              guardGuestAction("Sign in to save this", () => {
                void (async () => {
                  if (saved) {
                    const ok = await unsaveArticle(article.id);
                    flash(ok ? "Removed" : "Could not remove");
                  } else {
                    const ok = await saveArticle(article);
                    flash(ok ? "Article saved" : "Could not save");
                  }
                })();
              })
            }
          >
            <Bookmark
              className={`${iconClass} transition-colors ${
                saved ? "fill-[#00C6C6] text-[#00C6C6]" : ""
              }`}
              strokeWidth={2.25}
            />
          </RailAction>
        </RailActionSlot>
      </aside>

      {showSwipeHint && isFirstCard && (
        <div
          className="pointer-events-none absolute left-1/2 top-[4.75rem] z-30 -translate-x-1/2 transition-opacity duration-700 ease-out"
          style={{ opacity: swipeHintOpacity }}
          data-no-drag
        >
          <span className="pf-feed-toast whitespace-nowrap rounded-full border border-[var(--pocket-border)] px-3 py-1 text-[10px] backdrop-blur-sm">
            Swipe left for article · Swipe right for stock
          </span>
        </div>
      )}

      {showBottomChrome && (
      <div
        className={`pf-feed-bottom-chrome absolute inset-x-0 bottom-0 z-20 ${
          useSoftOverlay ? "pf-feed-bottom-chrome--soft" : ""
        } ${
          !overlayHomeReady
            ? "pointer-events-none opacity-0"
            : !overlayVisible
              ? "pf-feed-overlay-exit pointer-events-none"
              : "pf-feed-overlay-enter"
        }`}
      >
        <div
          className="pf-feed-bottom-content px-5 pb-5 pt-8"
          style={{ paddingRight: "5.25rem" }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#00C6C6]">
              {categoryTag}
            </span>
            {showTrendingLabel && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-300/90">
                <FireSparkIcon className="h-3.5 w-3.5" />
                Trending
              </span>
            )}
          </div>

          <div className="mt-2 flex items-start gap-2">
            {hotHeadline && <FireSparkIcon className="mt-1 h-4 w-4 shrink-0" />}
            <h1 className="pf-feed-headline line-clamp-3 text-[1.42rem] font-bold leading-[1.16] tracking-tight sm:text-[1.5rem]">
              {cleanArticleTitle(article.headline)}
            </h1>
          </div>

          {contextLine ? (
            <p className="pf-feed-subline mt-2 line-clamp-2 text-[13px] leading-snug">
              {contextLine}
            </p>
          ) : null}

          <div className="pf-feed-source mt-3">
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
        </div>
      </div>
      )}

      {toast && (
        <div
          className="pf-feed-toast pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-md"
          data-no-drag
        >
          {toast}
        </div>
      )}

      {guestPrompt && (
        <div
          className="pf-feed-toast absolute bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs backdrop-blur-md"
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

function FeedChip({
  label,
  kind,
}: {
  label: string;
  kind: "stock" | "topic";
}) {
  if (kind === "stock") {
    return (
      <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#00C6C6]/35 bg-[#00C6C6]/14 px-2.5 py-1 text-[11px] font-semibold text-[#00C6C6]">
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
    <div className="pf-feed-topic-chip mt-2.5 inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
      <span className="truncate">{label}</span>
    </div>
  );
}

function formatLikeCount(count: number): string {
  if (count >= 1_000_000) {
    const v = count / 1_000_000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 10_000) {
    const v = count / 1_000;
    return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(count);
}

function RailActionSlot({
  children,
  meta,
}: {
  children: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[52px] flex-col items-center justify-start">
      {children}
      <span className="mt-0.5 flex h-4 items-center justify-center">
        {meta}
      </span>
    </div>
  );
}

function RailAction({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
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
      className="flex h-11 w-11 items-center justify-center transition-transform active:scale-90"
      style={{ touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}
