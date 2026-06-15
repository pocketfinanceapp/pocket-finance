import {
  ArrowLeft,
  ArrowRight,
  ChartLine,
  Lock,
  MoveVertical,
  Newspaper,
  Smartphone,
  Target,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const STEPS: {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    step: "1",
    icon: MoveVertical,
    title: "Swipe through headlines",
    description: "Catch up on breaking market stories in seconds.",
  },
  {
    step: "2",
    icon: ArrowLeft,
    title: "Read the full story",
    description: "Open the full article from trusted financial sources.",
  },
  {
    step: "3",
    icon: ArrowRight,
    title: "Check the stock",
    description: "View live prices, charts, and key metrics instantly.",
  },
];

export function SwipeGestureSection() {
  return (
    <section className="border-t border-white/[0.06] px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Three swipes. All you need.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#9ca3af] sm:text-base">
            Everything you need to go from breaking news to market insight in
            seconds.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-5">
          {STEPS.map(({ step, icon: Icon, title, description }) => (
            <li
              key={step}
              className="rounded-2xl border border-white/[0.08] bg-[#111] p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-xs font-bold text-white">
                  {step}
                </span>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0B0B0D]">
                  <Icon className="h-5 w-5 text-[#00C6C6]" strokeWidth={2} />
                </div>
              </div>
              <h3 className="mt-5 text-base font-bold text-white sm:text-lg">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
