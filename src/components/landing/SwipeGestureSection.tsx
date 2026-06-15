import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const GESTURES: {
  icon: LucideIcon;
  gesture: string;
  label: string;
  hint: string;
}[] = [
  {
    icon: ArrowDownUp,
    gesture: "Swipe up/down",
    label: "Headlines",
    hint: "Browse the feed",
  },
  {
    icon: ArrowLeft,
    gesture: "Swipe left",
    label: "Full article",
    hint: "Read the story",
  },
  {
    icon: ArrowRight,
    gesture: "Swipe right",
    label: "Stock intel",
    hint: "Live prices & charts",
  },
];

export function SwipeGestureSection() {
  return (
    <section className="relative px-5 py-8 sm:px-8 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(0,198,198,0.06) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00C6C6]/80">
          How it works
        </p>
        <h2 className="mt-2 text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
          Three swipes. All you need.
        </h2>

        <div className="mt-5 flex flex-col gap-2.5 md:mt-8 md:grid md:grid-cols-3 md:gap-3">
          {GESTURES.map(({ icon: Icon, gesture, label, hint }) => (
            <div
              key={label}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#00C6C6]/20 bg-white/[0.04] px-3.5 py-3 backdrop-blur-sm"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px rgba(0,198,198,0.08)",
              }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00C6C6]/25 bg-[#00C6C6]/10">
                <Icon className="h-4 w-4 text-[#00C6C6]" strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#00C6C6]/90">
                  {gesture}
                </p>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-[10px] text-[#9ca3af]">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
