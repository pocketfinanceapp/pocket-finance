"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
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
import { PocketMarkIcon, PocketPublisherBadge } from "./PocketLogo";
import { useApp } from "@/context/AppContext";
import {
  getExplicitFilterLabels,
  hasExplicitFilters,
} from "@/lib/activeFilters";
import { getStockProfile } from "@/lib/stockData";

interface FeedCardProps {
  article: NewsArticle;
  active: boolean;
  feedMode: FeedMode;
  onFeedModeChange: (mode: FeedMode) => void;
  onOpenComments: () => void;
  onOpenFilter: () => void;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80";

export function FeedCard({
  article,
  active,
  feedMode,
  onFeedModeChange,
  onOpenComments,
  onOpenFilter,
}: FeedCardProps) {
  const stock = getStockProfile(article.ticker);
  const {
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    marketFilters,
    sectorFilters,
    searchQuery,
    clearFilters,
  } = useApp();

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
  const [liked, setLiked] = useState(false);
  const saved = isInWatchlist(article.ticker);
  const [likeCount, setLikeCount] = useState(article.likes);
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  }, []);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <section
      className="relative h-full w-full overflow-hidden bg-black"
      aria-hidden={!active}
    >
      <Image
        src={imgSrc}
        alt=""
        fill
        className="object-cover brightness-[0.52] contrast-[1.08] saturate-[0.92]"
        sizes="100vw"
        unoptimized
        priority={active}
        onError={() => setImgSrc(FALLBACK_IMAGE)}
      />

      {/* Premium vignette */}
      <div className="pointer-events-none absolute inset-0 bg-black/35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-black/35 to-black/[0.97]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/40" />

      {/* Top tabs + optional filter strip */}
      <header className="absolute left-0 right-0 top-0 z-20 flex flex-col pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between px-4 pb-1">
          <div className="flex w-10 shrink-0 items-center justify-start" data-no-drag>
            <PocketMarkIcon size={28} glow="normal" />
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

      {/* Right actions — above bottom nav */}
      <aside
        className="absolute bottom-[5.5rem] right-2 z-30 flex flex-col items-center gap-6"
        data-no-drag
        data-interactive
      >
        <ActionButton
          label={liked ? "Unlike" : "Like"}
          onClick={() => {
            setLiked((v) => !v);
            setLikeCount((c) => (liked ? c - 1 : c + 1));
          }}
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
            {formatCount(article.comments)}
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
          onClick={() => {
            if (saved) {
              removeFromWatchlist(article.ticker);
              flash("Removed from watchlist");
            } else {
              addToWatchlist(article.ticker);
              flash("Saved to watchlist");
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

      {/* Bottom-left content — logo + headline */}
      <div className="absolute bottom-[4.75rem] left-0 right-16 z-20 px-4">
        <h1 className="text-[1.55rem] font-bold leading-[1.15] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          {article.headline}
        </h1>
        <p className="mt-2 max-w-[92%] text-[13px] leading-snug text-white/65">
          {article.subheading}
        </p>

        <div className="mt-3">
          <MarketBadge
            market={article.market}
            ticker={article.ticker}
            logoColor={stock.logoColor}
            size="sm"
          />
        </div>

        <div className="mt-3">
          <PocketPublisherBadge timeLabel={timeAgo(article.publishedAt)} />
        </div>

        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md">
          <svg className="h-3 w-3 text-pocket-teal" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 17 L8 12 L12 15 L16 8 L21 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {article.ticker}
        </div>

        <div className="mt-4 flex items-center gap-1 text-white/30">
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
