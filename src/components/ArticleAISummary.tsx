"use client";

import { useEffect, useRef, useState } from "react";
import {
  evaluateDailyGoalCompletion,
  markBriefingCompleted,
} from "@/lib/progression";

interface ArticleAISummaryProps {
  headline: string;
  snippet: string;
  articleId: string;
}

function stripLeadingEmoji(text: string): string {
  return text
    .replace(
      /^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]+\s*/u,
      ""
    )
    .trim();
}

export function ArticleAISummary({
  headline,
  snippet,
  articleId,
}: ArticleAISummaryProps) {
  const [loading, setLoading] = useState(true);
  const [bullets, setBullets] = useState<string[] | null>(null);

  // Completion tracking refs — never trigger re-renders
  const completionFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch the AI summary
  useEffect(() => {
    let cancelled = false;

    // New article — reset completion gate
    completionFiredRef.current = false;
    setLoading(true);
    setBullets(null);

    // Clean up any pending completion logic from the previous article
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    observerRef.current?.disconnect();
    observerRef.current = null;

    void (async () => {
      try {
        const res = await fetch("/api/article-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headline, snippet }),
        });

        if (!res.ok) return;

        const data = (await res.json()) as { bullets?: string[] };
        if (!cancelled && data.bullets?.length) {
          setBullets(data.bullets);
        }
      } catch {
        /* hide section on failure */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [articleId, headline, snippet]);

  // Wire up completion logic once the briefing has fully generated
  useEffect(() => {
    // Guard: only run after generation is complete and content exists
    if (loading || !bullets) return;
    if (completionFiredRef.current) return;

    const fireCompletion = () => {
      if (completionFiredRef.current) return;
      completionFiredRef.current = true;

      // Clean up sibling trigger
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      observerRef.current?.disconnect();
      observerRef.current = null;

      // Record the briefing completion (also calls evaluateDailyGoalCompletion internally)
      markBriefingCompleted(articleId);
      // Explicit call per spec — idempotent if already called inside markBriefingCompleted
      evaluateDailyGoalCompletion();
      // Notify Profile UI to refresh progression state
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pf-progression-updated"));
      }
    };

    // Fallback: fire after 10 seconds of the briefing being visible
    timerRef.current = setTimeout(fireCompletion, 10_000);

    // Primary: fire as soon as the bottom of the briefing scrolls into view
    if (bottomRef.current && typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            fireCompletion();
          }
        },
        { threshold: 1.0 }
      );
      observerRef.current.observe(bottomRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [loading, bullets, articleId]);

  if (!loading && !bullets) return null;

  return (
    <div
      className="mt-5 mb-1 rounded-xl border p-3"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderColor: "rgba(0,198,198,0.15)",
      }}
    >
      {loading ? (
        <div className="space-y-2.5" aria-hidden>
          <div className="h-4 w-24 animate-pulse rounded-full bg-[#00C6C6]/10" />
          <div className="h-3.5 w-full animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3.5 w-[92%] animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3.5 w-[88%] animate-pulse rounded bg-white/[0.08]" />
        </div>
      ) : (
        <>
          <span className="inline-block rounded-full bg-[#00C6C6]/10 px-2 py-0.5 text-[11px] font-medium text-[#00C6C6]">
            Pocket Briefing
          </span>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            AI-generated summary based on the original article.
          </p>
          <ul className="mt-2">
            {bullets?.map((bullet) => (
              <li
                key={bullet}
                className="mb-2 border-l-[3px] border-[#00C6C6] pl-2.5 text-sm font-normal leading-snug text-white last:mb-0"
              >
                {stripLeadingEmoji(bullet)}
              </li>
            ))}
          </ul>
          {/* Zero-height sentinel — IntersectionObserver fires when this is visible */}
          <div ref={bottomRef} aria-hidden />
        </>
      )}
    </div>
  );
}
