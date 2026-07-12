"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildBriefingRequestPayload,
  buildFallbackBriefing,
  loadCachedBriefing,
  saveCachedBriefing,
  type PocketBriefing,
} from "@/lib/briefing";
import {
  evaluateDailyGoalCompletion,
  markBriefingCompleted,
} from "@/lib/progression";
import type { NewsArticle } from "@/lib/types";

interface ArticleAISummaryProps {
  article: NewsArticle;
}

function BriefingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-3.5 w-full animate-pulse rounded bg-white/[0.08]" />
      <div className="h-3.5 w-[92%] animate-pulse rounded bg-white/[0.08]" />
      <div className="h-3 w-20 animate-pulse rounded bg-white/[0.06]" />
      <div className="h-3.5 w-full animate-pulse rounded bg-white/[0.08]" />
    </div>
  );
}

function BriefingReport({ briefing }: { briefing: PocketBriefing }) {
  return (
    <div className="space-y-3.5">
      <p className="text-[14px] font-medium leading-[1.55] text-zinc-100">
        {briefing.lede}
      </p>

      {briefing.sections.map((section) => (
        <section key={section.title}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00C6C6]">
            {section.title}
          </h3>
          <div className="mt-1.5 space-y-2">
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[13px] leading-[1.6] text-zinc-300"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}

      <div className="rounded-lg border border-[#00C6C6]/20 bg-[#00C6C6]/5 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00C6C6]">
          Takeaway
        </p>
        <p className="mt-1 text-[13px] font-medium leading-[1.5] text-zinc-100">
          {briefing.takeaway}
        </p>
      </div>
    </div>
  );
}

export function ArticleAISummary({ article }: ArticleAISummaryProps) {
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<PocketBriefing | null>(null);

  const completionFiredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    completionFiredRef.current = false;
    setLoading(true);
    setBriefing(null);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    observerRef.current?.disconnect();
    observerRef.current = null;

    const cached = loadCachedBriefing(article.id);
    if (cached) {
      setBriefing(cached);
      setLoading(false);
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/article-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBriefingRequestPayload(article)),
        });

        if (!res.ok) {
          if (!cancelled) setBriefing(buildFallbackBriefing(article));
          return;
        }

        const data = (await res.json()) as { briefing?: PocketBriefing };
        if (!cancelled) {
          const next = data.briefing ?? buildFallbackBriefing(article);
          setBriefing(next);
          saveCachedBriefing(article.id, next);
        }
      } catch {
        if (!cancelled) setBriefing(buildFallbackBriefing(article));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [article]);

  useEffect(() => {
    if (loading || !briefing) return;
    if (completionFiredRef.current) return;

    const fireCompletion = () => {
      if (completionFiredRef.current) return;
      completionFiredRef.current = true;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      observerRef.current?.disconnect();
      observerRef.current = null;

      markBriefingCompleted(article.id);
      evaluateDailyGoalCompletion();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("pf-progression-updated"));
      }
    };

    timerRef.current = setTimeout(fireCompletion, 6_000);

    if (bottomRef.current && typeof IntersectionObserver !== "undefined") {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            fireCompletion();
          }
        },
        { threshold: 0.6 }
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
  }, [loading, briefing, article.id]);

  if (!loading && !briefing) return null;

  return (
    <div
      className="mt-6 rounded-2xl border p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderColor: "rgba(0,198,198,0.15)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-block rounded-full bg-[#00C6C6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#00C6C6]">
          Pocket Briefing
        </span>
        <span className="text-[10px] text-zinc-500">AI summary</span>
      </div>

      <div className="mt-3">
        {loading ? <BriefingSkeleton /> : briefing ? <BriefingReport briefing={briefing} /> : null}
      </div>

      <div ref={bottomRef} className="h-px w-full" aria-hidden />
    </div>
  );
}
