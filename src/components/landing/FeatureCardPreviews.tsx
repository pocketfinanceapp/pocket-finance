export function FeedCardPreview() {
  const rows = [
    { title: "w-[92%]", sub: "w-[68%]" },
    { title: "w-[85%]", sub: "w-[55%]" },
    { title: "w-[78%]", sub: "w-[48%]" },
  ];

  return (
    <div className="mt-4 space-y-2.5 rounded-xl border border-white/[0.04] bg-black/35 p-3">
      {rows.map((row, i) => (
        <div
          key={i}
          className="rounded-lg bg-white/[0.03] px-2.5 py-2"
        >
          <div className={`h-2 rounded bg-zinc-600/80 ${row.title}`} />
          <div className={`mt-1.5 h-1.5 rounded bg-zinc-700/70 ${row.sub}`} />
        </div>
      ))}
    </div>
  );
}

export function ArticleCardPreview() {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.04] bg-black/35 p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-700/80 text-[10px] font-bold text-zinc-400">
          R
        </div>
        <div className="min-w-0 flex-1">
          <div className="h-2 w-3/4 rounded bg-zinc-600/80" />
          <div className="mt-1.5 h-1.5 w-1/2 rounded bg-zinc-700/70" />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-zinc-800/80" />
        <div className="h-1.5 w-[90%] rounded bg-zinc-800/70" />
        <div className="h-1.5 w-[75%] rounded bg-zinc-800/60" />
      </div>
    </div>
  );
}

export function StockCardPreview() {
  return (
    <div className="mt-4 rounded-xl border border-white/[0.04] bg-black/35 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold text-white">NVDA</span>
        <span className="text-[10px] font-semibold text-[#00C6C6]">+4.2%</span>
      </div>
      <svg
        viewBox="0 0 200 48"
        className="mt-2 h-12 w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="sparkline-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B6EF5" />
            <stop offset="100%" stopColor="#00C6C6" />
          </linearGradient>
        </defs>
        <path
          d="M0,32 L25,28 L50,20 L75,24 L100,12 L125,18 L150,8 L175,16 L200,10"
          fill="none"
          stroke="url(#sparkline-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex gap-3">
        <div className="h-1.5 w-12 rounded bg-zinc-700/70" />
        <div className="h-1.5 w-10 rounded bg-zinc-800/60" />
      </div>
    </div>
  );
}
