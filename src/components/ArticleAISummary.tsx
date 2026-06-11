"use client";

import { useEffect, useState } from "react";

interface ArticleAISummaryProps {
  headline: string;
  snippet: string;
  articleId: string;
}

export function ArticleAISummary({
  headline,
  snippet,
  articleId,
}: ArticleAISummaryProps) {
  const [loading, setLoading] = useState(true);
  const [bullets, setBullets] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setBullets(null);

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

  if (!loading && !bullets) return null;

  return (
    <div className="mt-8">
      {loading ? (
        <div className="space-y-3" aria-hidden>
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded bg-white/[0.08]" />
          <div className="h-4 w-[92%] animate-pulse rounded bg-white/[0.08]" />
          <div className="h-4 w-[88%] animate-pulse rounded bg-white/[0.08]" />
        </div>
      ) : (
        <>
          <p className="text-xs text-[#9ca3af]">✨ AI Summary</p>
          <ul className="mt-3 space-y-3">
            {bullets?.map((bullet) => (
              <li
                key={bullet}
                className="text-[15px] font-normal leading-relaxed text-white"
              >
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-6 h-px bg-white/[0.08]" aria-hidden />
        </>
      )}
    </div>
  );
}
