"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Bookmark,
  ChevronUp,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import type { FeedMode } from "@/lib/filterArticles";
import { hasUsableFeedImage } from "@/lib/feedImage";
import type { NewsArticle } from "@/lib/types";
import { formatCount, timeAgo } from "@/lib/utils";
import { MarketBadge } from "./MarketBadge";
import { FeedCardFallbackBackground } from "./FeedCardFallbackBackground";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { SourceBadge } from "./SourceBadge";
import { useApp } from "@/context/AppContext";
import { useArticleLikes } from "@/hooks/useArticleLikes";
import { fetchCommentCount } from "@/lib/userInteractions";
import {
  getArticleDisplayTicker,
  resolveMarketForTicker,
} from "@/lib/tickerMap";
import { FeedHeader } from "./FeedHeader";

interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenComments: () => void;
  onOpenFilter: () => void;
  commentRefreshKey?: number;
}

const CARD_OVERLAY =
  "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.92) 100%)";

export function FeedCard({
  article,
  active,
  feedMode,
  onFeedModeChange,
  onOpenComments,
  onOpenFilter,
  commentRefreshKey = 0,
}: FeedCardProps) {
  const {
    saveArticle,
    unsaveArticle,
    isArticleSaved,
  } = useApp();
  const { liked, likeCount, toggleLike } = useArticleLikes(article);

  const usableInitial = hasUsableFeedImage(article.imageUrl);
  const [showImage, setShowImage] = useState(usableInitial);
  const [imgSrc, setImgSrc] = useState(usableInitial ? article.imageUrl : "");
  const saved = isArticleSaved(article.id);
  const [commentCount, setCommentCount] = useState(article.comments);
  const [toast, setToast] = useState<string | null>(null);
  const displayTicker = getArticleDisplayTicker(article);
  const displayMarket = resolveMarketForTicker(displayTicker);
  const isFallbackCard = !(showImage && imgSrc);

  useEffect(() => {
    const usable = hasUsableFeedImage(article.imageUrl);
    setShowImage(usable);
    setImgSrc(usable ? article.imageUrl : "");
  }, [article.id, article.imageUrl]);

  useEffect(() => {
    if (!active) return;
    void fetchCommentCount(article.id).then(setCommentCount);
  }, [active, article.id, commentRefreshKey]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

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
        <FeedCardFallbackBackground />
      )}

      <FeedHeader
        feedMode={feedMode}
        onFeedModeChange={onFeedModeChange}
        onOpenFilter={onOpenFilter}
        className="absolute left-0 right-0 top-0 z-20"
      />

      <aside
        className="absolute bottom-4 right-4 z-30 flex flex-col items-center gap-5"
        data-no-drag
        data-interactive
      >
        <ActionButton
          label={liked ? "Unlike" : "Like"}
          onClick={() => void toggleLike()}
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

        <ActionButton label="Comment" onClick={onOpenComments}>
          <MessageCircle className="h-[26px] w-[26px] text-white" />
          <span className="text-[11px] font-semibold text-white/90">
            {formatCount(commentCount)}
          </span>
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
          onClick={async () => {
            if (saved) {
              const ok = await unsaveArticle(article.id);
              flash(ok ? "Removed from watchlist" : "Could not remove");
            } else {
              const ok = await saveArticle(article);
              flash(ok ? "Saved to watchlist" : "Could not save");
            }
          }}
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
        <h1
          className={`line-clamp-3 text-[1.55rem] font-bold leading-[1.2] tracking-tight text-white ${
            isFallbackCard
              ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
              : "drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]"
          }`}
        >
          {cleanArticleTitle(article.headline)}
        </h1>
        {article.subheading ? (
          <p
            className={`mt-2 line-clamp-2 text-[14px] leading-snug ${
              isFallbackCard
                ? "text-white/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                : "text-white/70"
            }`}
          >
            {article.subheading}
          </p>
        ) : null}

        <div
          className={`mt-3 ${isFallbackCard ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]" : ""}`}
        >
          <MarketBadge market={displayMarket} size="sm" />
        </div>

        <div className="mt-2.5">
          <SourceBadge
            sourceName={article.sourceName}
            sourceId={article.sourceId}
            sourceUrl={article.sourceUrl}
            publishedAt={article.publishedAt}
            timeLabel={timeAgo(article.publishedAt)}
            onGradient={isFallbackCard}
          />
        </div>

        <div
          className={`mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold ${
            isFallbackCard
              ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
              : "rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-white/85 backdrop-blur-md"
          }`}
        >
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

        <div className="mt-3 flex items-center gap-1 text-white/30">
          <ChevronUp className="h-3.5 w-3.5" />
          <span className="text-[10px] tracking-wider">Swipe up for more</span>
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
