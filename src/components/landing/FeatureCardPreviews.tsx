const FEED_ROWS = [
  { ticker: "NVDA", title: "NVIDIA Hits Record High as AI Demand Surges", up: true },
  { ticker: "TSLA", title: "Tesla Cuts Prices Amid EV Competition", up: false },
  { ticker: "AAPL", title: "Apple Services Revenue Beats Estimates", up: true },
] as const;

export function FeedCardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/50">
      <div className="border-b border-white/[0.06] px-2.5 py-1.5">
        <div className="flex gap-2 text-[8px] font-semibold">
          <span className="text-white">For You</span>
          <span className="text-white/30">Trending</span>
          <span className="text-white/30">Following</span>
        </div>
      </div>
      <div className="space-y-1.5 p-2">
        {FEED_ROWS.map((row) => (
          <div
            key={row.ticker}
            className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.03] px-2 py-1.5"
          >
            <span className="shrink-0 rounded-md bg-[#00C6C6]/15 px-1.5 py-0.5 text-[8px] font-bold text-[#00C6C6]">
              {row.ticker}
            </span>
            <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-white/90">
              {row.title}
            </span>
            <span
              className={`shrink-0 text-[8px] font-semibold ${
                row.up ? "text-[#00C6C6]" : "text-red-400/80"
              }`}
            >
              {row.up ? "+4.2%" : "-1.1%"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArticleCardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/50">
      <div
        className="h-14 px-2.5 pt-2"
        style={{
          background:
            "linear-gradient(160deg, rgba(59,110,245,0.35) 0%, rgba(0,198,198,0.15) 100%)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-[#005594] text-[7px] font-bold text-white">
            R
          </span>
          <span className="text-[8px] text-white/70">Reuters · 1m ago</span>
        </div>
      </div>
      <div className="space-y-2 p-2.5">
        <p className="text-[10px] font-bold leading-snug text-white">
          NVIDIA Hits Record High as AI Demand Surges
        </p>
        <div className="rounded-lg border border-[#00C6C6]/20 bg-[#00C6C6]/5 p-2">
          <p className="text-[8px] font-semibold uppercase tracking-wide text-[#00C6C6]">
            AI Briefing
          </p>
          <p className="mt-1 text-[8px] leading-relaxed text-[#9ca3af]">
            AI chip demand drives record revenue outlook as data centre spend
            accelerates.
          </p>
        </div>
      </div>
    </div>
  );
}

export function StockCardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/50 p-2.5">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-[11px] font-bold text-white">NVDA</span>
          <p className="text-[8px] text-[#9ca3af]">NVIDIA Corp</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-white">$892.40</span>
          <p className="text-[9px] font-semibold text-[#00C6C6]">+4.2%</p>
        </div>
      </div>
      <svg
        viewBox="0 0 200 48"
        className="mt-2 h-10 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="landing-sparkline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B6EF5" />
            <stop offset="100%" stopColor="#00C6C6" />
          </linearGradient>
          <linearGradient id="landing-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,198,198,0.25)" />
            <stop offset="100%" stopColor="rgba(0,198,198,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,38 L0,32 L25,28 L50,20 L75,24 L100,12 L125,18 L150,8 L175,16 L200,10 L200,48 L0,48 Z"
          fill="url(#landing-sparkline-fill)"
        />
        <path
          d="M0,32 L25,28 L50,20 L75,24 L100,12 L125,18 L150,8 L175,16 L200,10"
          fill="none"
          stroke="url(#landing-sparkline)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {["Mkt Cap", "P/E", "Vol"].map((label) => (
          <div
            key={label}
            className="rounded-md border border-white/[0.05] bg-white/[0.03] px-1.5 py-1 text-center"
          >
            <p className="text-[7px] text-[#9ca3af]">{label}</p>
            <p className="text-[8px] font-semibold text-white/80">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
