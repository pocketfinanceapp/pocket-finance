/** Premium abstract fallback when an article has no usable image */
export function FeedCardFallbackBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 35%, rgba(59,110,245,0.28) 0%, rgba(0,198,198,0.12) 45%, rgba(10,10,10,0.98) 80%)",
        }}
      />
      <svg
        viewBox="0 0 400 600"
        className="absolute inset-0 h-full w-full opacity-70"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="feed-fallback-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B6EF5" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00C6C6" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {[80, 160, 240, 320, 400, 480].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="400"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}
        {[80, 160, 240, 320].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="600"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}
        <path
          d="M0,420 L0,380 L50,360 L100,390 L150,320 L200,340 L250,280 L300,300 L350,240 L400,260"
          fill="none"
          stroke="url(#feed-fallback-line)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.92) 100%)",
        }}
      />
    </div>
  );
}
