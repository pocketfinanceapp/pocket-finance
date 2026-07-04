"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { FeedSearchIcon } from "@/components/icons/FeedSearchIcon";

interface FeedSearchOverlayProps {
  open: boolean;
  articles: NewsArticle[];
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
}

export function FeedSearchOverlay({
  open,
  articles,
  onClose,
  onSelectArticle,
}: FeedSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [entered, setEntered] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setEntered(false);
      setFocused(false);
      return;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 80);
    const enterTimer = window.setTimeout(() => setEntered(true), 16);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(enterTimer);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return articles.filter((a) => a.headline.toLowerCase().includes(q)).slice(0, 40);
  }, [articles, query]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-300 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(4,5,8,0.97) 0%, rgba(8,10,16,0.98) 100%)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        className={`shrink-0 px-4 pb-3 transition-all duration-300 ease-out ${
          entered ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white active:bg-white/10"
            aria-label="Close search"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#00C6C6]">
              Pocket Search
            </p>
            <p className="text-[13px] text-zinc-500">Find headlines across your feed</p>
          </div>
        </div>

        <div
          className={`feed-search-bar relative overflow-hidden rounded-2xl transition-all duration-300 ${
            entered ? "feed-search-bar-active" : ""
          } ${focused ? "feed-search-bar-focused" : ""}`}
          style={{
            background: "rgba(255,255,255,0.04)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="feed-search-bar-shimmer" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-80"
            style={{
              background:
                "linear-gradient(135deg, rgba(59,110,245,0.12), rgba(0,198,198,0.08))",
            }}
          />
          <div className="relative flex items-center gap-3 px-4 py-3">
            <FeedSearchIcon active className="h-9 w-9 shrink-0 scale-90" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search market headlines…"
              autoFocus
              className="feed-search-input-caret min-w-0 flex-1 bg-transparent text-[16px] text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-400 active:bg-white/10"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <ul
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 transition-all duration-300 delay-75 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {query.trim() === "" ? (
          <li className="flex flex-col items-center px-4 py-14 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(59,110,245,0.18), rgba(0,198,198,0.12))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Sparkles className="h-6 w-6 text-[#00C6C6]" strokeWidth={1.75} />
            </div>
            <p className="text-[15px] font-semibold text-white">Search the feed</p>
            <p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-zinc-500">
              Type a company, ticker, or topic to jump straight to a story.
            </p>
          </li>
        ) : results.length === 0 ? (
          <li className="px-4 py-10 text-center">
            <p className="text-[15px] font-semibold text-white">No matches</p>
            <p className="mt-1 text-[13px] text-zinc-500">
              Nothing found for &ldquo;{query.trim()}&rdquo;
            </p>
          </li>
        ) : (
          results.map((article, index) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onSelectArticle(article)}
                className="feed-search-result mb-2 flex w-full flex-col gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 text-left active:bg-white/[0.06]"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">
                  {cleanArticleTitle(article.headline)}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {article.sourceName} · {timeAgo(article.publishedAt)}
                </p>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
