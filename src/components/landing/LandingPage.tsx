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
      <header className="relative overflow-hidden pb-5 pt-[max(0,env(safe-area-inset-top))] sm:pb-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 20%, rgba(59,110,245,0.16) 0%, rgba(0,198,198,0.08) 45%, transparent 75%)",
          }}
          aria-hidden
        />

        <nav className="relative z-10 border-b border-white/[0.06]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2.5 sm:px-8 sm:py-4">
            <PocketBrand layout="horizontal" iconSize={32} glow="normal" />
            <Link
              href={APP_BASE}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-[#00C6C6] transition-colors hover:border-[#3B6EF5]"
            >
              Try the app
            </Link>
          </div>
        </nav>

        <div className="relative px-5 pt-3 sm:px-8 sm:pt-8">
          <div className="mx-auto grid max-w-6xl items-start gap-3 sm:gap-6 md:grid-cols-2 md:gap-10 lg:gap-14">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00C6C6]/25 bg-[#00C6C6]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#00C6C6] sm:text-[11px]">
                <Zap className="h-3 w-3" strokeWidth={2.5} />
                Breaking markets · Real-time
              </div>
              <h1 className="mt-2.5 text-[1.65rem] font-bold leading-[1.1] tracking-tight sm:mt-4 sm:text-5xl">
                Finance news, built for the way{" "}
                <span className="bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-transparent">
                  you scroll.
                </span>
              </h1>
              <p className="mx-auto mt-2 max-w-lg text-[13px] leading-snug text-[#9ca3af] sm:mt-3 sm:text-base sm:leading-relaxed md:mx-0">
                Pocket Finance turns breaking market headlines into a fast,
                swipeable experience — read the story, check the stock, and
                move on in seconds.
              </p>
              <div className="mt-3.5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:gap-3 md:justify-start">
                <Link
                  href={APP_BASE}
                  className="w-full rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-3 text-center text-[15px] font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-transform active:scale-[0.98] sm:w-auto sm:px-8 sm:py-3.5"
                >
                  Try the app
                </Link>
                <a
                  href="#waitlist"
                  className="w-full rounded-xl border border-white/20 bg-white/[0.03] px-6 py-3 text-center text-[15px] font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/30 sm:w-auto sm:px-8 sm:py-3.5"
                >
                  Join waitlist
                </a>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-4 sm:flex sm:flex-wrap sm:gap-2 md:justify-start">
                {TRUST_CHIPS.map((chip) => (
                  <div
                    key={chip}
                    className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#111]/80 px-2.5 py-1 text-[10px] backdrop-blur-sm sm:px-3 sm:py-1.5 sm:text-[11px]"
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
              <div className="mt-2.5 flex w-full max-w-[200px] justify-between gap-1.5 sm:mt-4 sm:max-w-[260px] sm:gap-2">
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

      {/* Features */}
      <section className="relative border-t border-white/[0.06] px-5 py-8 sm:px-8 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,110,245,0.08) 0%, transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <h2 className="text-center text-xl font-bold leading-snug sm:text-3xl">
            News, articles, and stock data{" "}
            <span className="bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] bg-clip-text text-transparent">
              in one swipe.
            </span>
          </h2>
          <div className="mt-5 grid gap-3 sm:mt-8 md:grid-cols-3 md:gap-5">
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
                <div className="p-3 pt-2.5 sm:p-4 sm:pt-3">
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

      {/* Why Pocket Finance works */}
      <section className="border-t border-white/[0.06] px-5 py-7 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-lg font-bold sm:text-xl">
            Why Pocket Finance works
          </h2>
          <div className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-3">
            {WHY_CHOOSE.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 sm:p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#00C6C6]/25 bg-[#00C6C6]/10">
                  <Icon className="h-4 w-4 text-[#00C6C6]" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section
        id="waitlist"
        className="relative border-t border-white/[0.06] px-5 py-10 sm:px-8 sm:py-16"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(0,198,198,0.1) 0%, transparent 65%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-lg rounded-2xl border border-white/[0.08] bg-[#111]/60 p-5 backdrop-blur-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#00C6C6]/15 sm:mb-4">
              <PocketBrand layout="icon" iconSize={24} glow="none" />
            </div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Get early access to Pocket Finance.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
              Join the waitlist for launch updates, early testing, and product
              drops.
            </p>
            <div className="mt-5 w-full sm:mt-6">
              <WaitlistForm />
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-[#9ca3af]">
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              No spam. Just launch updates and early access.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
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
