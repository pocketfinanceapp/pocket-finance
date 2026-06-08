import Link from "next/link";
import { ChartLine, Newspaper, Zap } from "lucide-react";
import { PocketBrand } from "@/components/PocketLogo";
import { APP_BASE } from "@/lib/appPaths";
import { WaitlistForm } from "./WaitlistForm";

const FEATURES = [
  {
    icon: Zap,
    title: "Live News Feed",
    description:
      "TikTok-style swipe feed of global market headlines — stay on top of breaking news in seconds.",
  },
  {
    icon: Newspaper,
    title: "Full Articles",
    description:
      "Swipe left to read the full story from top sources. No clutter, just the news that matters.",
  },
  {
    icon: ChartLine,
    title: "Stock Intelligence",
    description:
      "Swipe right for live prices, charts, and financials. Context on every headline, instantly.",
  },
] as const;

const STEPS = [
  {
    step: "1",
    title: "Swipe through headlines",
    description:
      "Scroll vertically through full-screen cards — each one a breaking market story.",
  },
  {
    step: "2",
    title: "Read the full story",
    description:
      "Swipe left to dive into the complete article from trusted financial sources.",
  },
  {
    step: "3",
    title: "Check the stock",
    description:
      "Swipe right for live prices, charts, ratios, and competitor data on the ticker.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <header className="relative overflow-hidden px-5 pb-20 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 sm:pb-28 sm:pt-16">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100%,720px)] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(59,110,245,0.35) 0%, rgba(0,198,198,0.2) 45%, transparent 70%)",
          }}
          aria-hidden
        />

        <nav className="relative z-10 mx-auto flex max-w-5xl items-center justify-between">
          <PocketBrand layout="horizontal" iconSize={36} glow="normal" />
          <Link
            href={APP_BASE}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
          >
            Try the app
          </Link>
        </nav>

        <div className="relative z-10 mx-auto mt-16 max-w-3xl text-center sm:mt-20">
          <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight sm:text-5xl sm:leading-[1.1]">
            Finance news, built for the way you scroll.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#9ca3af] sm:text-lg">
            Swipe through breaking market headlines, read full articles, and
            check stock intelligence — all in seconds.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="#waitlist"
              className="w-full rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-8 py-4 text-center text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.3)] transition-transform active:scale-[0.98] sm:w-auto"
            >
              Get Early Access
            </a>
            <Link
              href={APP_BASE}
              className="w-full rounded-xl border border-white/20 bg-transparent px-8 py-4 text-center text-[15px] font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.04] sm:w-auto"
            >
              Try the app
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/[0.06] bg-[#111] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00C6C6]/15">
                <Icon className="h-5 w-5 text-[#00C6C6]" strokeWidth={2.25} />
              </div>
              <h2 className="mt-5 text-lg font-bold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/[0.06] px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-12 space-y-10">
            {STEPS.map(({ step, title, description }) => (
              <li key={step} className="flex gap-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] text-sm font-bold text-white">
                  {step}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#9ca3af]">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Waitlist */}
      <section
        id="waitlist"
        className="border-t border-white/[0.06] px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Be first to know when we launch.
          </h2>
          <p className="mt-3 max-w-md text-sm text-[#9ca3af]">
            Join the waitlist for early access to Pocket Finance on iOS and web.
          </p>
          <div className="mt-8 w-full flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-8">
        <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-[#9ca3af]">
          Pocket Finance provides market news and general information only. Not
          financial advice. © 2026 Pocket Finance.
        </p>
      </footer>
    </div>
  );
}
