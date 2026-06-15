import {
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { PocketMarkIcon } from "@/components/PocketLogo";

const FEED_TABS = ["For You", "Trending", "Following"] as const;

export function PhoneMockup() {
  return (
    <div
      className="relative h-[420px] w-[210px] shrink-0 drop-shadow-[0_24px_64px_rgba(0,0,0,0.55)] sm:h-[480px] sm:w-[240px] md:h-[520px] md:w-[260px]"
      aria-hidden
    >
      <svg
        viewBox="0 0 270 550"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect
          x="1"
          y="1"
          width="268"
          height="548"
          rx="44"
          fill="#000000"
          stroke="#374151"
          strokeWidth="2"
        />
        <rect x="14" y="14" width="242" height="522" rx="34" fill="#0a0a0a" />
        <rect
          x="98"
          y="22"
          width="74"
          height="22"
          rx="11"
          fill="#111111"
          stroke="#1f2937"
          strokeWidth="1"
        />
      </svg>

      <div className="absolute inset-[14px] flex flex-col overflow-hidden rounded-[34px] bg-[#0a0a0a]">
        {/* App header + tabs */}
        <div className="shrink-0 border-b border-white/[0.06] bg-black/90 px-3 pb-1 pt-2">
          <div className="flex items-center justify-between">
            <PocketMarkIcon size={22} glow="none" />
            <div className="flex gap-2.5 text-[8px] font-semibold tracking-wide sm:text-[9px]">
              {FEED_TABS.map((tab, i) => (
                <span
                  key={tab}
                  className={`relative pb-1.5 ${
                    i === 0 ? "text-white" : "text-white/35"
                  }`}
                >
                  {tab}
                  {i === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 h-px rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6]" />
                  )}
                </span>
              ))}
            </div>
            <div className="h-5 w-5" />
          </div>
        </div>

        {/* Feed card */}
        <div className="relative min-h-0 flex-1">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(118,185,0,0.35) 0%, rgba(59,110,245,0.25) 35%, rgba(10,10,10,0.95) 70%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.92) 100%)",
            }}
          />

          {/* Ticker + move */}
          <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between">
            <span className="rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm">
              NVDA
            </span>
            <span className="text-[9px] font-bold text-[#00C6C6]">+4.2%</span>
          </div>

          {/* NVIDIA mark placeholder */}
          <div className="absolute left-1/2 top-[38%] z-[1] -translate-x-1/2 -translate-y-1/2">
            <span className="text-4xl font-black tracking-tighter text-[#76b900]/90 sm:text-5xl">
              NVIDIA
            </span>
          </div>

          {/* Side actions */}
          <aside className="absolute bottom-16 right-2.5 z-10 flex flex-col items-center gap-3">
            <Heart className="h-4 w-4 text-white/90" strokeWidth={2} />
            <MessageCircle className="h-4 w-4 text-white/90" strokeWidth={2} />
            <Share2 className="h-4 w-4 text-white/90" strokeWidth={2} />
            <Bookmark className="h-4 w-4 text-white/90" strokeWidth={2} />
          </aside>

          {/* Bottom copy */}
          <div className="absolute bottom-3 left-3 right-10 z-10">
            <h3 className="line-clamp-2 text-[11px] font-bold leading-snug text-white sm:text-[12px]">
              NVIDIA Hits Record High as AI Demand Surges
            </h3>
            <p className="mt-1 text-[8px] text-white/55 sm:text-[9px]">
              Reuters · 1m ago
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 py-0.5 text-[8px] font-semibold text-white/85">
              <svg
                className="h-2 w-2 text-[#00C6C6]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3 17 L8 12 L12 15 L16 8 L21 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              NVDA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
