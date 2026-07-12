"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { fuzzyMatchesQuery } from "@/lib/fuzzySearch";

interface FeedSearchOverlayProps {
  open: boolean;
  articles: NewsArticle[];
  onClose: () => void;
  onSelectArticle: (article: NewsArticle) => void;
}

interface ScoredArticle {
  article: NewsArticle;
  score: number;
}

function scoreArticle(article: NewsArticle, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  if (article.ticker.toLowerCase() === q) score += 100;
  else if (article.ticker.toLowerCase().includes(q)) score += 60;

  if (article.companyName.toLowerCase().includes(q)) score += 40;
  if (article.headline.toLowerCase().includes(q)) score += 30;
  if (article.tags.some((t) => t.toLowerCase().includes(q))) score += 20;
  if (article.sector.toLowerCase().includes(q)) score += 15;
  if (article.sourceName.toLowerCase().includes(q)) score += 10;

  return score;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-[#00C6C6]/20 px-0.5 text-pocket-text">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
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

  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const picks: NewsArticle[] = [];
    for (const article of articles) {
      if (seen.has(article.ticker)) continue;
      seen.add(article.ticker);
      picks.push(article);
      if (picks.length >= 6) break;
    }
    return picks;
  }, [articles]);

  const results = useMemo((): ScoredArticle[] => {
    const q = query.trim();
    if (!q) return [];

    return articles
      .filter((article) =>
        fuzzyMatchesQuery(q, [
          article.headline,
          article.ticker,
          article.companyName,
          article.sourceName,
          article.sector,
          ...article.tags,
        ])
      )
      .map((article) => ({ article, score: scoreArticle(article, q) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [articles, query]);

  if (!open) return null;

  const trimmedQuery = query.trim();

  return (
    <div
      className={`pf-theme-scope fixed inset-0 z-50 flex flex-col transition-opacity duration-250 ${
        entered ? "opacity-100" : "opacity-0"
      }`}
      style={{
        background: "var(--pocket-search-overlay)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        className={`shrink-0 px-4 pb-2 transition-all duration-250 ease-out ${
          entered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-pocket-text active:bg-[var(--pocket-surface-hover)]"
            aria-label="Close search"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div
            className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl border transition-all duration-200 ${
              focused
                ? "border-[#00C6C6]/40 shadow-[0_0_0_3px_rgba(0,198,198,0.08)]"
                : "border-[var(--pocket-border)]"
            }`}
            style={{
              background: "var(--pocket-search-bar)",
            }}
          >
            <div className="flex items-center gap-2.5 px-3.5 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-pocket-muted" strokeWidth={2.25} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Search tickers, companies, headlines…"
                autoFocus
                className="feed-search-input-caret min-w-0 flex-1 bg-transparent text-[16px] text-pocket-text placeholder:text-pocket-muted focus:outline-none"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 text-[12px] font-medium text-[#00C6C6] active:opacity-70"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 transition-all duration-250 delay-50 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {trimmedQuery === "" ? (
          <div className="pt-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-pocket-muted">
              Trending in feed
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {suggestions.map((article) => (
                <button
                  key={article.id}
                  type="button"
                  onClick={() => onSelectArticle(article)}
                  className="rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-3 py-1.5 text-[12px] font-semibold text-pocket-text active:bg-[var(--pocket-surface-hover)]"
                >
                  ${article.ticker}
                </button>
              ))}
            </div>
            <p className="mt-8 px-1 text-center text-[13px] text-pocket-muted">
              Find any story by ticker, company, or headline
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="px-2 py-14 text-center">
            <p className="text-[15px] font-semibold text-pocket-text">No matches</p>
            <p className="mt-1 text-[13px] text-pocket-muted">
              Try a ticker symbol or company name
            </p>
          </div>
        ) : (
          <ul className="space-y-2 pt-1">
            {results.map(({ article }, index) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => onSelectArticle(article)}
                  className="feed-search-result flex w-full items-start gap-3 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-3.5 py-3 text-left active:bg-[var(--pocket-surface-hover)]"
                  style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                >
                  <span className="mt-0.5 shrink-0 rounded-lg bg-[#00C6C6]/12 px-2 py-1 text-[11px] font-bold text-[#00C6C6]">
                    {article.ticker}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-pocket-text">
                      {highlightMatch(cleanArticleTitle(article.headline), trimmedQuery)}
                    </p>
                    <p className="mt-1 text-[11px] text-pocket-muted">
                      {article.companyName} · {timeAgo(article.publishedAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
