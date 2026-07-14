import Link from "next/link";
import {
  Building2,
  ChartLine,
  Flame,
  Globe2,
  MoveVertical,
  Newspaper,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { PocketBrand } from "@/components/PocketLogo";
import { LOGIN_PATH } from "@/lib/appPaths";
import {
  ArticleCardPreview,
  BrowseCardPreview,
  FeedCardPreview,
  ProgressCardPreview,
  StockCardPreview,
} from "./FeatureCardPreviews";
import { PhoneMockup } from "./PhoneMockup";
import { SwipeGestureSection } from "./SwipeGestureSection";

const TRUST_CHIPS = [
  "Pocket Briefings",
  "Personalized feed",
  "Global markets",
  "Streaks & levels",
] as const;

const SWIPE_LABELS = [
  { icon: MoveVertical, label: "Swipe headlines" },
  { icon: Newspaper, label: "Read full story" },
  { icon: ChartLine, label: "Check the stock" },
] as const;

const FEATURES = [
  {
    icon: Zap,
    title: "Swipe-first feed",
    description:
      "Breaking markets in a Reels-style stream — For You and Trending, ranked for you.",
    preview: FeedCardPreview,
  },
  {
    icon: Sparkles,
    title: "Pocket Briefing",
    description:
      "Open any story for a short AI summary — what happened and why it matters.",
    preview: ArticleCardPreview,
  },
  {
    icon: ChartLine,
    title: "Company intel",
    description:
      "Live prices, charts, and key stats on every ticker — from headline to panel.",
    preview: StockCardPreview,
  },
  {
    icon: Building2,
    title: "Browse everything",
    description:
      "Companies, markets, and crypto ordered by what actually matters — biggest names first.",
    preview: BrowseCardPreview,
  },
  {
    icon: Flame,
    title: "Streaks & achievements",
    description:
      "Read daily, level up, and unlock clear progress like “3/10 articles read.”",
    preview: ProgressCardPreview,
  },
] as const;

const PILLARS = [
  {
    icon: Globe2,
    title: "Your region, your currency",
    description:
      "Pick your country once — we softly prioritise local markets and display prices your way.",
  },
  {
    icon: Target,
    title: "Markets & sectors you follow",
    description:
      "Personalise For You without hiding the bigger story. Change preferences anytime in Settings.",
  },
  {
    icon: Trophy,
    title: "Stay consistent",
    description:
      "Daily goals, streaks, and achievement tracks turn reading into a habit — not a chore.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-[#0a0a0a] text-white">
      <header className="relative overflow-hidden pb-6 pt-[max(0,env(safe-area-inset-top))] sm:pb-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 18%, rgba(59,110,245,0.18) 0%, rgba(0,198,198,0.09) 42%, transparent 72%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse 70% 55% at 50% 30%, black 20%, transparent 75%)",
          }}
          aria-hidden
        />

        <nav className="relative z-10 border-b border-white/[0.06]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5 sm:px-8 sm:py-4">
            <PocketBrand layout="horizontal" iconSize={32} glow="normal" />
            <Link
              href={LOGIN_PATH}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-[#00C6C6] transition-colors hover:border-[#3B6EF5]"
            >
              Open app
            </Link>
          </div>
        </nav>

        <div className="relative px-5 pt-4 sm:px-8 sm:pt-10">
          <div className="mx-auto grid max-w-6xl items-center gap-5 sm:gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
            <div className="text-center md:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#00C6C6]">
                Pocket Finance
              </p>
              <h1 className="mt-2.5 text-[1.85rem] font-bold leading-[1.08] tracking-tight sm:mt-3 sm:text-5xl sm:leading-[1.05]">
                Markets, briefly —{" "}
                <span className="bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-transparent">
                  built for scrolling.
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-[#9ca3af] sm:mt-4 sm:text-base md:mx-0">
                Swipe headlines, get AI briefings, browse companies and crypto,
                and personalise your feed by region — then keep a streak going.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3 md:justify-start">
                <Link
                  href={LOGIN_PATH}
                  className="w-full rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-3.5 text-center text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-transform active:scale-[0.98] sm:w-auto sm:px-8"
                >
                  Open the app
                </Link>
                <a
                  href="#features"
                  className="w-full rounded-xl border border-white/20 bg-white/[0.03] px-6 py-3.5 text-center text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/30 sm:w-auto sm:px-8"
                >
                  See what&apos;s inside
                </a>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap sm:gap-2 md:justify-start">
                {TRUST_CHIPS.map((chip) => (
                  <div
                    key={chip}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#111]/80 px-2.5 py-1.5 text-[10px] backdrop-blur-sm sm:px-3 sm:text-[11px]"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00C6C6]"
                      aria-hidden
                    />
                    <span className="whitespace-nowrap font-medium text-white/90">
                      {chip}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <div
                className="relative"
                style={{
                  filter:
                    "drop-shadow(0 0 60px rgba(0,198,198,0.18)) drop-shadow(0 24px 48px rgba(0,0,0,0.5))",
                }}
              >
                <PhoneMockup />
              </div>
              <div className="mt-3 flex w-full max-w-[220px] justify-between gap-1.5 sm:mt-4 sm:max-w-[280px] sm:gap-2">
                {SWIPE_LABELS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-1 flex-col items-center gap-1.5 text-center"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#00C6C6]/20 bg-white/[0.04] backdrop-blur-sm">
                      <Icon
                        className="h-3.5 w-3.5 text-[#00C6C6]"
                        strokeWidth={2}
                      />
                    </div>
                    <span className="text-[9px] leading-tight text-[#9ca3af] sm:text-[10px]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <SwipeGestureSection />

      <section
        id="features"
        className="relative border-t border-white/[0.06] px-5 py-10 sm:px-8 sm:py-16"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,110,245,0.08) 0%, transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00C6C6]/80">
            Inside the app
          </p>
          <h2 className="mt-2 text-center text-xl font-bold leading-snug sm:text-3xl">
            Everything you need after the headline{" "}
            <span className="bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-transparent">
              — without the clutter.
            </span>
          </h2>
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, preview: Preview }) => (
              <article
                key={title}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111]/80 backdrop-blur-sm"
                style={{
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="p-2.5 pb-0 sm:p-3">
                  <Preview />
                </div>
                <div className="p-3.5 pt-2.5 sm:p-4 sm:pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00C6C6]/15">
                      <Icon
                        className="h-4 w-4 text-[#00C6C6]"
                        strokeWidth={2.25}
                      />
                    </div>
                    <h3 className="text-base font-bold text-white">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-5 py-9 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-lg font-bold sm:text-2xl">
            Personal by design
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[#9ca3af]">
            Soft ranking — never hard walls. The big stories still show up.
          </p>
          <div className="mt-5 grid gap-2.5 sm:mt-7 sm:grid-cols-3 sm:gap-3">
            {PILLARS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00C6C6]/25 bg-[#00C6C6]/10">
                  <Icon className="h-4 w-4 text-[#00C6C6]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#9ca3af]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/[0.06] px-5 py-12 sm:px-8 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 80%, rgba(0,198,198,0.12) 0%, transparent 65%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C6C6]/15">
            <PocketBrand layout="icon" iconSize={28} glow="none" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready when you are.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#9ca3af] sm:text-base">
            Jump into a personalized For You feed, explore Browse, and start
            your streak in under a minute.
          </p>
          <Link
            href={LOGIN_PATH}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-transform active:scale-[0.98] sm:w-auto"
          >
            Open Pocket Finance
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
          <PocketBrand layout="horizontal" iconSize={28} glow="none" />
          <p className="text-center text-xs leading-relaxed text-[#9ca3af]">
            Pocket Finance provides market news and general information only.
            Not financial advice. © 2026 Pocket Finance.
          </p>
        </div>
      </footer>
    </div>
  );
}
