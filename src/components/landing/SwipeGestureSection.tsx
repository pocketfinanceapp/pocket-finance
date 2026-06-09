import { ArrowLeft, ArrowRight, MoveVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const GESTURES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: MoveVertical,
    title: "Swipe up & down",
    description: "Browse breaking market headlines",
  },
  {
    icon: ArrowLeft,
    title: "Swipe left",
    description: "Read the full article",
  },
  {
    icon: ArrowRight,
    title: "Swipe right",
    description: "Check live stock prices",
  },
];

export function SwipeGestureSection() {
  return (
    <section className="px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Three swipes. All you need.
        </h2>

        <div className="-mx-5 mt-8 flex flex-nowrap gap-3 overflow-x-auto px-5 scrollbar-hide md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          {GESTURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="w-[200px] shrink-0 rounded-xl border border-white/[0.06] bg-[#111] p-5 md:w-auto"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] shadow-[0_4px_16px_rgba(59,110,245,0.25)]">
                <Icon className="h-5 w-5 text-white" strokeWidth={2.25} />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#9ca3af]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
