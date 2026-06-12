"use client";

import { useEffect, useState } from "react";
import { FinancialTermText } from "./FinancialTermText";

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
    <div
      className="mt-8 mb-4 rounded-xl border p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderColor: "rgba(0,198,198,0.15)",
      }}
    >
      {loading ? (
        <div className="space-y-3" aria-hidden>
          <div className="h-5 w-24 animate-pulse rounded-full bg-[#00C6C6]/10" />
          <div className="h-4 w-full animate-pulse rounded bg-white/[0.08]" />
          <div className="h-4 w-[92%] animate-pulse rounded bg-white/[0.08]" />
          <div className="h-4 w-[88%] animate-pulse rounded bg-white/[0.08]" />
        </div>
      ) : (
        <>
          <span className="inline-block rounded-full bg-[#00C6C6]/10 px-2.5 py-1 text-xs font-medium text-[#00C6C6]">
            AI Briefing
          </span>
          <ul className="mt-3">
            {bullets?.map((bullet) => (
              <li
                key={bullet}
                className="mb-3 border-l-[3px] border-[#00C6C6] pl-3 text-sm font-normal leading-relaxed text-white last:mb-0"
              >
                <FinancialTermText text={stripLeadingEmoji(bullet)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
