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
import { FEED_CONTENT_BOTTOM_PADDING } from "@/lib/layout";
import type { NewsArticle } from "@/lib/types";
import { formatCount, timeAgo } from "@/lib/utils";
import { MarketBadge } from "./MarketBadge";
import { PocketMarkIcon } from "./PocketLogo";
import { SourceBadge } from "./SourceBadge";
import { useApp } from "@/context/AppContext";
import { useArticleLikes } from "@/hooks/useArticleLikes";
import { fetchCommentCount } from "@/lib/userInteractions";
import { getArticleDisplayTicker } from "@/lib/tickerMap";
import {
  getExplicitFilterLabels,
  hasExplicitFilters,
} from "@/lib/activeFilters";

interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenComments: () => void;
  onOpenFilter: () => void;
  commentRefreshKey?: number;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80";

/** Text-readability scrim — concentrated at the bottom, not the whole lower half */
const CINEMATIC_OVERLAY =
  "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.88) 100%)";

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
    marketFilters,
    sectorFilters,
    searchQuery,
    clearFilters,
  } = useApp();
  const { liked, likeCount, toggleLike } = useArticleLikes(article, active);

  const filterLabels = getExplicitFilterLabels(
    marketFilters,
    sectorFilters,
    searchQuery
  );
  const showFilterPill = hasExplicitFilters(
    marketFilters,
    sectorFilters,
    searchQuery
  );
  const [imgSrc, setImgSrc] = useState(article.imageUrl || FALLBACK_IMAGE);
  const saved = isArticleSaved(article.id);
  const [commentCount, setCommentCount] = useState(article.comments);
  const [toast, setToast] = useState<string | null>(null);
  const displayTicker = getArticleDisplayTicker(article);

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
    <section
      className="flex h-full w-full flex-col overflow-hidden bg-black"
      aria-hidden={!active}
    >
      {/* Header — sits above the image, never overlaps card media */}
      <header className="relative z-20 shrink-0 border-b border-white/[0.06] bg-black/90 backdrop-blur-md">
        <div
          className="flex items-center justify-between px-4 pb-1.5"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="flex w-10 shrink-0 items-center justify-start" data-no-drag>
            <PocketMarkIcon size={28} glow="none" />
          </div>
          <nav className="flex gap-7 text-[13px] font-semibold tracking-wide">
            <button
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={() => onFeedModeChange("forYou")}
              className={`relative pb-2 ${
                feedMode === "forYou" ? "text-white" : "text-white/40"
              }`}
            >
              For You
              {feedMode === "forYou" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
              )}
            </button>
            <button
              type="button"
              data-no-drag
              onPointerDown={stop}
              onClick={() => onFeedModeChange("following")}
              className={`relative pb-2 ${
                feedMode === "following" ? "text-white" : "text-white/40"
              }`}
            >
              Following
              {feedMode === "following" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
              )}
            </button>
          </nav>
          <button
            type="button"
            data-no-drag
            onPointerDown={stop}
            onClick={onOpenFilter}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 active:bg-white/10"
            aria-label="Search"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="2" />
              <path strokeWidth="2" d="M20 20l-4-4" />
            </svg>
          </button>
        </div>
        {showFilterPill && (
          <div className="flex justify-center px-4 pb-2" data-no-drag>
            <button
              type="button"
              onPointerDown={stop}
              onClick={clearFilters}
              className="max-w-full truncate rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-medium text-zinc-400 backdrop-blur-sm active:bg-white/10"
            >
              {filterLabels.join(" · ")}
              <span className="ml-1.5 text-zinc-500">×</span>
            </button>
          </div>
        )}
      </header>

      {/* Image + overlays + bottom content */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={imgSrc}
            alt=""
            fill
            className="object-cover brightness-[0.92] contrast-[1.05]"
            sizes="100vw"
            unoptimized
            priority={active}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: CINEMATIC_OVERLAY }}
        />

        <aside
          className="absolute right-2 z-30 flex flex-col items-center gap-5"
          style={{ bottom: FEED_CONTENT_BOTTOM_PADDING }}
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
            <span className="text-[11px] font-semibold text-white/90">
              {formatCount(likeCount)}
            </span>
          </ActionButton>

          <ActionButton label="Comment" onClick={onOpenComments}>
            <MessageCircle className="h-[26px] w-[26px] text-white" />
            <span className="text-[11px] font-semibold text-white/90">
              {formatCount(commentCount)}
            </span>
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
            <Share2 className="h-[25px] w-[25px] text-white" />
            <span className="text-[11px] font-semibold text-white/90">
              {formatCount(article.shares)}
            </span>
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
          className="absolute inset-x-0 bottom-0 left-0 z-20 px-5 pr-16"
          style={{ paddingBottom: FEED_CONTENT_BOTTOM_PADDING }}
        >
          <h1 className="line-clamp-3 text-[1.55rem] font-bold leading-[1.2] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
            {article.headline}
          </h1>
          <p className="mt-2 line-clamp-2 max-w-[94%] text-[14px] leading-snug text-white/70">
            {article.subheading}
          </p>

          <div className="mt-3">
            <MarketBadge market={article.market} size="sm" />
          </div>

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

          <div className="mt-3 flex items-center gap-1 text-white/30">
            <ChevronUp className="h-3.5 w-3.5 animate-bounce" />
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
    </section>
  );
}

function ActionButton({
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
      className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-white transition-transform active:scale-90"
      style={{ touchAction: "manipulation" }}
    >
      {children}
    </button>
  );
}
