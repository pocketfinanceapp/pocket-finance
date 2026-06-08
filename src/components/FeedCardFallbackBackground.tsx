import { PocketGradientMark } from "./PocketLogo";

const FALLBACK_GRADIENT =
  "linear-gradient(145deg, #3B6EF5 0%, #00C6C6 100%)";

const FALLBACK_CARD_OVERLAY =
  "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.28) 85%, rgba(0,0,0,0.55) 100%)";

/** Gradient fallback — brand background + white P only (no ticker text) */
export function FeedCardFallbackBackground() {
  return (
    <>
      <div
        className="absolute inset-0 z-0"
        style={{ background: FALLBACK_GRADIENT }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 35% 25%, rgba(255,255,255,0.35), transparent 55%)",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: FALLBACK_CARD_OVERLAY }}
      />
      <PocketGradientMark />
    </>
  );
}
