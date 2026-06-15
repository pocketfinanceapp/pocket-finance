import Link from "next/link";
import {
  ChartLine,
  Lock,
  MoveVertical,
  Newspaper,
  Smartphone,
  Target,
  Zap,
} from "lucide-react";
import { PocketBrand } from "@/components/PocketLogo";
import { APP_BASE } from "@/lib/appPaths";
import {
  ArticleCardPreview,
  FeedCardPreview,
  StockCardPreview,
} from "./FeatureCardPreviews";
import { PhoneMockup } from "./PhoneMockup";
import { SwipeGestureSection } from "./SwipeGestureSection";
import { WaitlistForm } from "./WaitlistForm";

const TRUST_CHIPS = [
  "ASX + US Markets",
  "Live Prices",
  "AI Briefings",
  "50+ Sources",
] as const;

const SWIPE_LABELS = [
  { icon: MoveVertical, label: "Swipe headlines" },
  { icon: Newspaper, label: "Read full story" },
  { icon: ChartLine, label: "Check the stock" },
] as const;

const FEATURES = [
  {
    icon: Zap,
    title: "Live News Feed",
    description:
      "A swipe-first stream of market headlines designed for speed.",
    preview: FeedCardPreview,
  },
  {
    icon: Newspaper,
    title: "Full Articles",
    description:
      "Go deeper with the full story from top financial publishers.",
    preview: ArticleCardPreview,
  },
  {
    icon: ChartLine,
    title: "Stock Intelligence",
    description:
      "Get live prices, charts, and context on every ticker.",
    preview: StockCardPreview,
  },
] as const;

const WHY_CHOOSE = [
  {
    icon: Zap,
    title: "Built for speed",
    description: "No noise. Just the news that moves the market.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Designed for how you scroll, anytime, anywhere.",
  },
  {
    icon: Target,
    title: "From headline to insight",
    description: "News, context, and market data — all in one place.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <header className="relative overflow-hidden pb-6 pt-[max(0,env(safe-area-inset-top))] sm:pb-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 65% 35%, rgba(59,110,245,0.14) 0%, rgba(0,198,198,0.08) 40%, transparent 70%)",
          }}
          aria-hidden
        />

        <nav className="relative z-10 border-b border-[#1f2937]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5 sm:px-8 sm:py-4">
            <PocketBrand layout="horizontal" iconSize={32} glow="normal" />
            <Link
              href={APP_BASE}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-[#00C6C6] transition-colors hover:border-[#3B6EF5] hover:text-[#00C6C6]"
            >
              Try the app
            </Link>
          </div>
        </nav>

        <div className="relative px-5 pt-4 sm:px-8 sm:pt-10">
          <div className="mx-auto grid max-w-6xl items-start gap-4 md:grid-cols-2 md:gap-10 lg:gap-14">
            <div className="text-center md:text-left">
              <h1 className="text-[1.65rem] font-bold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.1]">
                Finance news, built for the way{" "}
                <span className="bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-transparent">
                  you scroll.
                </span>
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-[14px] leading-snug text-[#9ca3af] sm:mt-5 sm:text-lg sm:leading-relaxed md:mx-0">
                Pocket Finance turns breaking market headlines into a fast,
                swipeable experience — so you can read the story, check the
                stock, and understand what matters in seconds.
              </p>
              <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:mt-8 sm:flex-row sm:gap-4 md:justify-start">
                <Link
                  href={APP_BASE}
                  className="w-full rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-3 text-center text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.3)] transition-transform active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4"
                >
                  Try the app
                </Link>
                <a
                  href="#waitlist"
                  className="w-full rounded-xl border border-white/20 bg-transparent px-6 py-3 text-center text-[15px] font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/[0.04] sm:w-auto sm:px-8 sm:py-4"
                >
                  Join waitlist
                </a>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 md:justify-start">
                {TRUST_CHIPS.map((chip) => (
                  <div
                    key={chip}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#111] px-2.5 py-1 text-[11px] sm:px-4 sm:py-2 sm:text-sm"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00C6C6] sm:h-2 sm:w-2"
                      aria-hidden
                    />
                    <span className="whitespace-nowrap font-medium text-white">
                      {chip}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center md:-mt-2 md:items-end lg:-mt-4">
              <div
                className="relative origin-top scale-[0.72] sm:scale-90 md:scale-100"
                style={{
                  filter: "drop-shadow(0 0 48px rgba(0,198,198,0.12))",
                }}
              >
                <PhoneMockup />
              </div>
              <div className="mt-2 flex w-full max-w-[220px] justify-between gap-1 px-1 sm:mt-5 sm:max-w-[270px] sm:gap-2">
                {SWIPE_LABELS.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex flex-1 flex-col items-center gap-1 text-center sm:gap-1.5"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111] sm:h-9 sm:w-9">
                      <Icon
                        className="h-3.5 w-3.5 text-[#00C6C6] sm:h-4 sm:w-4"
                        strokeWidth={2}
                      />
                    </div>
                    <span className="text-[9px] leading-tight text-[#9ca3af] sm:text-[11px]">
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

      {/* Features */}
      <section className="border-t border-white/[0.06] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Powerful features. Built for investors.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, preview: Preview }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/[0.06] bg-[#111] p-5 sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C6C6]/15">
                  <Icon className="h-5 w-5 text-[#00C6C6]" strokeWidth={2.25} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                  {description}
                </p>
                <Preview />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why investors choose */}
      <section className="border-t border-white/[0.06] px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Why Pocket Finance works
          </h2>
          <ul className="mt-10 space-y-4">
            {WHY_CHOOSE.map(({ icon: Icon, title, description }) => (
              <li
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#111] p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00C6C6]/30 bg-[#00C6C6]/10">
                  <Icon className="h-5 w-5 text-[#00C6C6]" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#9ca3af]">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Waitlist */}
      <section
        id="waitlist"
        className="border-t border-white/[0.06] px-5 py-14 sm:px-8 sm:py-20"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Get early access to Pocket Finance.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9ca3af] sm:text-base">
            Join the waitlist for launch updates, early testing, and product
            drops.
          </p>
          <div className="mt-8 flex w-full justify-center">
            <WaitlistForm />
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#9ca3af]">
            <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            No spam. Just launch updates and early access.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
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
