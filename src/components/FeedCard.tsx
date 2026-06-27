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
import {
  hasSeenSwipeHintThisSession,
  markSwipeHintSeen,
} from "@/lib/feedOnboarding";
import { resolveFeedChip } from "@/lib/feedChip";
import { resolveMarketForArticle } from "@/lib/tickerMap";

interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  showBottomChrome?: boolean;
  isFirstCard?: boolean;
  showTrendingLabel?: boolean;
  onOpenComments: () => void;
  commentRefreshKey?: number;
}

const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_SLOP = 28;

function FeedCardOverlays({ soft = false }: { soft?: boolean }) {
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-[1] h-16 bg-gradient-to-b ${
          soft ? "from-black/35 to-transparent" : "from-black/45 to-transparent"
        }`}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light"
        style={{
          background: soft
            ? "linear-gradient(135deg, rgba(59,110,245,0.12) 0%, transparent 42%, rgba(0,198,198,0.08) 100%)"
            : "linear-gradient(135deg, rgba(59,110,245,0.16) 0%, transparent 42%, rgba(0,198,198,0.12) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: soft
            ? "linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.03) 18%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0.52) 68%, rgba(0,0,0,0.82) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.06) 18%, rgba(0,0,0,0.14) 45%, rgba(0,0,0,0.58) 68%, rgba(0,0,0,0.86) 100%)",
        }}
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
}: FeedCardProps) {
  const { saveArticle, unsaveArticle, isArticleSaved } = useApp();
  const { user, isGuest, requestSignIn } = useAuth();
  const { liked, likeCount, toggleLike, likeOnly } = useArticleLikes(article);

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
    "h-[26px] w-[26px] text-white opacity-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]";

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
      className="relative h-full w-full overflow-hidden bg-[#0a0a0a]"
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
            className={`absolute inset-0 h-full w-full object-cover object-top contrast-[1.02] saturate-[0.92] ${
              useSoftOverlay ? "brightness-[0.84]" : "brightness-[0.72]"
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
        className="absolute right-3 top-[46%] z-30 flex -translate-y-1/2 flex-col items-center gap-4 sm:right-4"
        data-no-drag
        data-interactive
      >
        <div className="flex flex-col items-center">
          <PopReaction
            aria-label={liked ? "Unlike" : "Like"}
            burst={!liked}
            onClick={() =>
              guardGuestAction("Sign in to like this", () => void toggleLike())
            }
            className="flex h-11 w-11 items-center justify-center transition-transform active:scale-90"
          >
            <Heart
              className={`${iconClass} transition-colors ${
                liked ? "fill-[#00C6C6] text-[#00C6C6]" : ""
              }`}
              strokeWidth={2.25}
            />
          </PopReaction>
          {likeCount > 0 && (
            <span className="-mt-0.5 text-[11px] font-semibold tabular-nums leading-none text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              {formatLikeCount(likeCount)}
            </span>
          )}
        </div>

        <RailAction
          label="Comment"
          onClick={() =>
            guardGuestAction("Sign in to comment", onOpenComments)
          }
        >
          <MessageCircle className={iconClass} strokeWidth={2.25} />
        </RailAction>

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
      </aside>

      {showSwipeHint && isFirstCard && (
        <div
          className="pointer-events-none absolute left-1/2 top-[4.75rem] z-30 -translate-x-1/2 transition-opacity duration-700 ease-out"
          style={{ opacity: swipeHintOpacity }}
          data-no-drag
        >
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] text-white/75 backdrop-blur-sm">
            Swipe left for article · Swipe right for stock
          </span>
        </div>
      )}

      {showBottomChrome && (
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%]"
          style={{
            background: useSoftOverlay
              ? "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.62) 30%, rgba(0,0,0,0.24) 58%, transparent 100%)"
              : "linear-gradient(to top, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.68) 30%, rgba(0,0,0,0.28) 58%, transparent 100%)",
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
        </div>
      </div>
      )}

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
    <div className="mt-2.5 inline-flex max-w-full items-center rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/78">
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
