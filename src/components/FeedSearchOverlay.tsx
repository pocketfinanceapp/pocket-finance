"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return articles.filter((a) => a.headline.toLowerCase().includes(q));
  }, [articles, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div
        className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] px-4 pb-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          autoFocus
          className="min-w-0 flex-1 rounded-xl border border-white/[0.12] bg-[#141414] px-4 py-3 text-[15px] text-white placeholder:text-zinc-500 focus:border-[#3B6EF5] focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-white/10"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {query.trim() === "" ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">
            Type to search headlines
          </li>
        ) : results.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">
            No articles match &ldquo;{query.trim()}&rdquo;
          </li>
        ) : (
          results.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onSelectArticle(article)}
                className="flex w-full flex-col gap-1 border-b border-white/[0.06] px-4 py-4 text-left active:bg-white/[0.04]"
              >
                <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-white">
                  {cleanArticleTitle(article.headline)}
                </p>
                <p className="text-xs text-zinc-500">
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
