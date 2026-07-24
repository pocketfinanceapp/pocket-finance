"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { cleanArticleTitle } from "@/lib/sourceBranding";
import { fuzzyMatchesQuery } from "@/lib/fuzzySearch";
import {
  PANEL_EXIT_MS,
  TAB_ENTER_EASE,
  TAB_EXIT_EASE,
} from "@/lib/tabEnterAnimation";

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
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // This used to only ever match against `articles` — the ~60-article
  // locally-loaded feed pool — which is why searching a real, common
  // ticker like "AAPL" or a company like "Tesla" came back "No matches"
  // unless that specific article happened to already be sitting in the
  // small local page. Same class of problem Browse by topic/region had
  // before their dedicated live fetches. This now also queries Marketaux's
  // full catalog live, debounced, and merges the results in underneath the
  // instant local matches (which still show immediately with no lag).
  const [liveResults, setLiveResults] = useState<NewsArticle[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setLiveResults([]);
      setLiveLoading(false);
      return;
    }

    let cancelled = false;
    setLiveLoading(true);
    const debounce = window.setTimeout(() => {
      fetch(`/api/marketaux/search-news?q=${encodeURIComponent(trimmed)}&limit=40`)
        .then((res) => (res.ok ? res.json() : { articles: [] }))
        .then((data: { articles?: NewsArticle[] }) => {
          if (!cancelled) setLiveResults(data.articles ?? []);
        })
        .catch(() => {
          if (!cancelled) setLiveResults([]);
        })
        .finally(() => {
          if (!cancelled) setLiveLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(debounce);
    };
  }, [query]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        window.clearTimeout(focusTimer);
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }

    setEntered(false);
    setFocused(false);
    document.body.style.overflow = "";
    const resetTimer = window.setTimeout(() => {
      setQuery("");
      setMounted(false);
    }, PANEL_EXIT_MS);
    return () => window.clearTimeout(resetTimer);
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

    const local = articles
      .filter((article) =>
        fuzzyMatchesQuery(
          q,
          [
            article.headline,
            article.companyName,
            article.sourceName,
            article.sector,
            ...article.tags,
          ],
          [article.ticker]
        )
      )
      .map((article) => ({ article, score: scoreArticle(article, q) }));

    const seenIds = new Set(local.map((r) => r.article.id));
    // Live results are already relevance-matched server-side (Marketaux
    // symbol/full-text search) — score them just high enough to interleave
    // reasonably with strong local matches, but after exact local matches.
    const live = liveResults
      .filter((article) => !seenIds.has(article.id))
      .map((article) => ({ article, score: scoreArticle(article, q) || 25 }));

    return [...local, ...live].sort((a, b) => b.score - a.score).slice(0, 40);
  }, [articles, liveResults, query]);

  if (!mounted) return null;

  const trimmedQuery = query.trim();

  return (
    <div
      className="pf-theme-scope fixed inset-0 z-50 flex flex-col"
      style={{
        background: "var(--pocket-search-overlay)",
        backdropFilter: entered ? "blur(16px)" : "blur(0px)",
        opacity: entered ? 1 : 0,
        transform: entered ? "translateY(0) scale(1)" : "translateY(12px) scale(1.02)",
        transition: entered
          ? `opacity 360ms ${TAB_ENTER_EASE}, transform 420ms ${TAB_ENTER_EASE}, backdrop-filter 360ms ${TAB_ENTER_EASE}`
          : `opacity 280ms ${TAB_EXIT_EASE}, transform 320ms ${TAB_EXIT_EASE}, backdrop-filter 280ms ${TAB_EXIT_EASE}`,
      }}
    >
      <div
        className="shrink-0 px-4 pb-2"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(-8px)",
          transition: entered
            ? `opacity 400ms ${TAB_ENTER_EASE} 40ms, transform 460ms ${TAB_ENTER_EASE} 40ms`
            : `opacity 240ms ${TAB_EXIT_EASE}, transform 280ms ${TAB_EXIT_EASE}`,
        }}
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
            className={`relative min-w-0 flex-1 overflow-hidden rounded-2xl border transition-colors duration-200 ${
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          opacity: entered ? 1 : 0,
          transform: entered ? "translateY(0)" : "translateY(10px)",
          transition: entered
            ? `opacity 420ms ${TAB_ENTER_EASE} 80ms, transform 480ms ${TAB_ENTER_EASE} 80ms`
            : `opacity 260ms ${TAB_EXIT_EASE}, transform 300ms ${TAB_EXIT_EASE}`,
        }}
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
        ) : results.length === 0 && liveLoading ? (
          <div className="px-2 py-14 text-center">
            <p className="text-[13px] text-pocket-muted">
              Searching &ldquo;{trimmedQuery}&rdquo;…
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
