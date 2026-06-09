import { Heart, MessageCircle, Share2 } from "lucide-react";

export function PhoneMockup() {
  return (
    <div
      className="relative h-[450px] w-[220px] shrink-0 drop-shadow-[0_24px_64px_rgba(0,0,0,0.55)] md:h-[550px] md:w-[270px]"
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

      <div className="absolute inset-[14px] overflow-hidden rounded-[34px]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(59,110,245,0.55) 0%, rgba(0,198,198,0.35) 45%, rgba(10,10,10,0.95) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        <aside className="absolute bottom-20 right-3 z-10 flex flex-col items-center gap-4">
          <Heart className="h-5 w-5 text-white/90" strokeWidth={2} />
          <MessageCircle className="h-5 w-5 text-white/90" strokeWidth={2} />
          <Share2 className="h-5 w-5 text-white/90" strokeWidth={2} />
        </aside>

        <div className="absolute bottom-6 left-4 right-14 z-10">
          <h3 className="line-clamp-3 text-[15px] font-bold leading-snug text-white">
            NVIDIA Hits Record High as AI Demand Surges
          </h3>
          <p className="mt-2 text-[10px] text-white/60">Reuters · 1m ago</p>
          <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[9px] font-semibold text-white/85">
            <svg
              className="h-2.5 w-2.5 text-[#00C6C6]"
              viewBox="0 0 24 24"
              fill="none"
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
  );
}
