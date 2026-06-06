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
import type { NewsArticle } from "@/lib/types";
import { formatCount, timeAgo } from "@/lib/utils";
import { MarketBadge } from "./MarketBadge";
import { PocketMarkIcon } from "./PocketLogo";
import {
  hasUsableFeedImage,
  isPlainFeedImage,
  sourceGradientBackground,
} from "@/lib/feedImage";
import { cleanArticleTitle, resolveSourceBrand } from "@/lib/sourceBranding";
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
  const sourceBrand = resolveSourceBrand(
    article.sourceName,
    article.sourceId,
    article.sourceUrl
  );
  const usableInitial = hasUsableFeedImage(article.imageUrl);
  const [useGradient, setUseGradient] = useState(!usableInitial);
  const [imgSrc, setImgSrc] = useState(
    usableInitial ? article.imageUrl : ""
  );
  const saved = isArticleSaved(article.id);
  const [commentCount, setCommentCount] = useState(article.comments);
  const [toast, setToast] = useState<string | null>(null);
  const displayTicker = getArticleDisplayTicker(article);

  useEffect(() => {
    const usable = hasUsableFeedImage(article.imageUrl);
    setUseGradient(!usable);
    setImgSrc(usable ? article.imageUrl : "");
  }, [article.id, article.imageUrl]);

  useEffect(() => {
    if (!active) return;
    void fetchCommentCount(article.id).then(setCommentCount);
  }, [active, article.id, commentRefreshKey]);

  const handleImageLoad = useCallback(
    async (img: HTMLImageElement) => {
      if (useGradient) return;
      const plain = await isPlainFeedImage(img);
      if (plain) setUseGradient(true);
    },
    [useGradient]
  );

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="feed-card-shell relative h-full w-full overflow-hidden bg-black">
      {useGradient ? (
        <FeedGradientBackdrop
          accentColor={sourceBrand.color}
          watermark={displayTicker}
        />
      ) : (
        <Image
          src={imgSrc}
          alt=""
          fill
          className="absolute inset-0 h-full w-full object-cover brightness-[0.92] contrast-[1.05]"
          sizes="100vw"
          unoptimized
          priority={active}
          onLoad={(e) => {
            void handleImageLoad(e.currentTarget);
          }}
          onError={() => setUseGradient(true)}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: CARD_OVERLAY }}
      />

      <header className="absolute left-0 right-0 top-0 z-20 border-b border-white/[0.06] bg-black/90 backdrop-blur-md">
        <div
          className="flex items-center justify-between px-4 pb-1.5"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <div className="flex w-9 shrink-0 items-center justify-start" data-no-drag>
            <PocketMarkIcon size={36} glow="none" />
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
        className="z-20"
        style={{
          position: "absolute",
          bottom: "16px",
          left: 0,
          right: 0,
          padding: "0 80px 0 20px",
        }}
      >
        <h1 className="line-clamp-3 text-[1.55rem] font-bold leading-[1.2] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
          {cleanArticleTitle(article.headline)}
        </h1>
        {article.subheading ? (
          <p className="mt-2 line-clamp-2 text-[14px] leading-snug text-white/70">
            {article.subheading}
          </p>
        ) : null}

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

function FeedGradientBackdrop({
  accentColor,
  watermark,
}: {
  accentColor: string;
  watermark: string;
}) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: sourceGradientBackground(accentColor) }}
      />
      <div className="feed-gradient-pattern absolute inset-0 opacity-90" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className="select-none font-black uppercase tracking-tighter text-white/20"
          style={{ fontSize: "clamp(4.5rem, 24vw, 10rem)" }}
          aria-hidden
        >
          {watermark}
        </span>
      </div>
    </div>
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
