"use client";

import { useEffect, useState } from "react";
import {
  formatDailyBriefingDate,
  loadCachedDailyBriefing,
  parseBriefingBullet,
  sanitizeBriefingBullets,
  saveCachedDailyBriefing,
} from "@/lib/dailyBriefing";

interface DailyMarketBriefingCardProps {
  active: boolean;
}

function BulletShimmer() {
  return (
    <div
      className="rounded-[10px] border border-white/[0.08] p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-white/[0.08]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-white/[0.08]" />
          <div className="h-3.5 w-[88%] animate-pulse rounded bg-white/[0.08]" />
        </div>
      </div>
    </div>
  );
}

export function DailyMarketBriefingCard({ active }: DailyMarketBriefingCardProps) {
  const [loading, setLoading] = useState(true);
  const [bullets, setBullets] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);
  const dateLabel = formatDailyBriefingDate();

  useEffect(() => {
    if (!active) return;

    const cached = loadCachedDailyBriefing();
    if (cached) {
      setBullets(cached);
      setFailed(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setBullets(null);

    void (async () => {
      try {
        const res = await fetch("/api/daily-briefing");
        if (!res.ok) throw new Error("fetch failed");

        const data = (await res.json()) as { bullets?: string[] };
        if (cancelled) return;

        if (data.bullets?.length) {
          const cleaned = sanitizeBriefingBullets(data.bullets);
          setBullets(cleaned);
          saveCachedDailyBriefing(cleaned);
          setFailed(false);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a0a0a]">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[72px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a] sm:text-[88px]"
        aria-hidden
      >
        MARKETS
      </div>

      <div className="relative z-10 flex h-full flex-col px-5 pb-28 pt-24">
        <div className="flex items-center justify-between">
          <span className="inline-block rounded-full bg-[#00C6C6]/10 px-2.5 py-1 text-xs font-medium text-[#00C6C6]">
            Daily Briefing
          </span>
          <span className="text-sm text-[#9ca3af]">{dateLabel}</span>
        </div>

        <div
          className="mt-4 h-px w-full"
          style={{ backgroundColor: "rgba(0,198,198,0.3)" }}
        />

        <h2 className="mt-8 text-[28px] font-bold leading-tight text-white">
          Markets{" "}
          <span className="bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-transparent">
            Today
          </span>
        </h2>

        <div className="mt-6 flex flex-1 flex-col gap-3 overflow-y-auto">
          {loading ? (
            <>
              <BulletShimmer />
              <BulletShimmer />
              <BulletShimmer />
              <BulletShimmer />
            </>
          ) : failed || !bullets ? (
            <p className="py-8 text-center text-sm text-[#9ca3af]">
              Briefing unavailable — check back soon
            </p>
          ) : (
            bullets.map((bullet) => {
              const { emoji, text } = parseBriefingBullet(bullet);
              return (
                <div
                  key={bullet}
                  className="rounded-[10px] border border-white/[0.08] px-4 py-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 text-base leading-relaxed">
                      {emoji}
                    </span>
                    <p className="text-sm leading-relaxed text-white">{text}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-[#9ca3af]">
          ✦ AI Generated{" "}
          <span className="text-[#00C6C6]">·</span> Updated daily
        </p>
      </div>
    </div>
  );
}
