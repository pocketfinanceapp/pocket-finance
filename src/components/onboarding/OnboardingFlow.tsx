"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bitcoin,
  Building2,
  Check,
  Cpu,
  Cross,
  Landmark,
  type LucideIcon,
  Pickaxe,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { PocketMarkIcon } from "@/components/PocketLogo";
import { MarketFlag } from "@/components/MarketFlag";
import { useApp } from "@/context/AppContext";
import {
  ONBOARDING_MARKETS,
  SECTOR_FILTERS,
  type MarketFilter,
  type SectorFilter,
} from "@/lib/filters";
import { getMarketById } from "@/lib/markets";
import {
  currencyForRegion,
  filterAppRegions,
  getAppRegion,
  type AppCurrency,
  type AppRegionId,
} from "@/lib/regionPreferences";

const SECTOR_ICONS: Record<SectorFilter, LucideIcon> = {
  Technology: Cpu,
  Finance: Landmark,
  Energy: Zap,
  Mining: Pickaxe,
  Healthcare: Cross,
  Consumer: ShoppingBag,
  Crypto: Bitcoin,
  "Real Estate": Building2,
};

type Step = 0 | 1 | 2 | 3 | 4;

export function OnboardingFlow() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [region, setRegion] = useState<AppRegionId>("us");
  const [currency, setCurrency] = useState<AppCurrency>("USD");
  const [markets, setMarkets] = useState<MarketFilter[]>([]);
  const [sectors, setSectors] = useState<SectorFilter[]>([]);

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, []);

  const goTo = useCallback(
    (next: Step) => {
      if (exiting) return;
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      setTransitioning(true);
      transitionTimer.current = setTimeout(() => {
        setStep(next);
        setTransitioning(false);
        transitionTimer.current = null;
      }, 220);
    },
    [exiting]
  );

  const selectRegion = (next: AppRegionId) => {
    if (exiting) return;
    setRegion(next);
    setCurrency(currencyForRegion(next));
    // Soft-start markets empty only once — preselect home exchanges.
    setMarkets((prev) =>
      prev.length > 0 ? prev : [...getAppRegion(next).primaryMarkets]
    );
  };

  const toggleMarket = (m: MarketFilter) => {
    if (exiting) return;
    setMarkets((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const toggleSector = (s: SectorFilter) => {
    if (exiting) return;
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const finish = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      completeOnboarding(markets, sectors, region, currency);
      exitTimer.current = null;
    }, 1350);
  }, [completeOnboarding, currency, exiting, markets, region, sectors]);

  return (
    <div
      className={`app-shell-height fixed inset-0 z-[100] mx-auto flex w-full max-w-mobile flex-col pf-theme-scope bg-pocket-bg text-pocket-text ${
        exiting ? "onboarding-shell-exit" : ""
      }`}
    >
      <div
        className={`flex justify-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))] transition-opacity duration-300 ${
          exiting ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <StepDots total={5} current={step} />
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col transition-all duration-300 ease-out ${
          transitioning
            ? "translate-x-3 opacity-70"
            : "translate-x-0 opacity-100"
        } ${exiting ? "pointer-events-none opacity-0" : ""}`}
      >
        {step === 0 && <WelcomeStep onNext={() => goTo(1)} />}
        {step === 1 && (
          <RegionStep
            selected={region}
            currency={currency}
            onSelect={selectRegion}
            onNext={() => goTo(2)}
          />
        )}
        {step === 2 && (
          <MarketsStep
            selected={markets}
            onToggle={toggleMarket}
            onNext={() => goTo(3)}
          />
        )}
        {step === 3 && (
          <SectorsStep
            selected={sectors}
            onToggle={toggleSector}
            onNext={() => goTo(4)}
          />
        )}
        {step === 4 && !exiting && (
          <ReadyStep
            region={region}
            currency={currency}
            markets={markets}
            sectors={sectors}
            onFinish={finish}
          />
        )}
      </div>

      {exiting && (
        <OnboardingOutro
          region={region}
          markets={markets}
          sectors={sectors}
        />
      )}
    </div>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 bg-[#00C6C6] onboarding-step-dot-active"
              : "w-1.5 bg-[var(--pocket-surface-hover)]"
          }`}
        />
      ))}
    </div>
  );
}

const WELCOME_PARTICLES = [
  { left: "8%", top: "18%", size: 2, delay: "0s" },
  { left: "22%", top: "72%", size: 3, delay: "1.2s" },
  { left: "78%", top: "24%", size: 2, delay: "0.6s" },
  { left: "88%", top: "58%", size: 2, delay: "2s" },
  { left: "45%", top: "12%", size: 1, delay: "1.8s" },
  { left: "62%", top: "82%", size: 2, delay: "0.3s" },
  { left: "15%", top: "42%", size: 1, delay: "2.4s" },
  { left: "92%", top: "38%", size: 1, delay: "1s" },
  { left: "35%", top: "88%", size: 2, delay: "1.5s" },
  { left: "55%", top: "48%", size: 1, delay: "0.9s" },
  { left: "72%", top: "14%", size: 2, delay: "2.2s" },
  { left: "5%", top: "65%", size: 1, delay: "0.4s" },
] as const;

function WelcomeAmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="onboarding-ambient-orb onboarding-ambient-orb-a" />
      <div className="onboarding-ambient-orb onboarding-ambient-orb-b" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 40%, rgba(59,110,245,0.12) 0%, transparent 55%)",
        }}
      />
      {WELCOME_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="onboarding-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <WelcomeAmbientBackground />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="onboarding-enter onboarding-enter-d1 mx-auto mb-10">
            <div className="onboarding-mark-float">
              <PocketMarkIcon size={120} glow="none" />
            </div>
          </div>

          <h1 className="onboarding-enter onboarding-enter-d2 text-[34px] font-extrabold leading-tight tracking-tight text-pocket-text antialiased">
            Pocket Finance
          </h1>

          <p className="onboarding-enter onboarding-enter-d3 mt-3 bg-gradient-to-r from-[#3B6EF5] via-[#5B8EF7] to-[#00C6C6] bg-clip-text text-lg font-semibold tracking-wide text-transparent">
            Markets, briefly.
          </p>

          <p className="onboarding-enter onboarding-enter-d4 mt-5 max-w-[300px] text-[15px] leading-relaxed text-pocket-muted">
            Swipe headlines, get AI briefings, and track what matters — without
            the noise.
          </p>
        </div>

        <div className="onboarding-enter onboarding-enter-d5 shrink-0 pt-6">
          <WelcomeCtaButton onClick={onNext}>Get Started</WelcomeCtaButton>
        </div>
      </div>
    </div>
  );
}

function WelcomeCtaButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="onboarding-cta-glow w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] via-[#4A7EF6] to-[#00C6C6] py-[18px] text-[17px] font-bold tracking-wide text-white transition-transform active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function RegionStep({
  selected,
  currency,
  onSelect,
  onNext,
}: {
  selected: AppRegionId;
  currency: AppCurrency;
  onSelect: (region: AppRegionId) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState("");
  const regions = useMemo(() => filterAppRegions(query), [query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <h1 className="onboarding-enter onboarding-enter-d1 shrink-0 text-2xl font-bold tracking-tight">
        Where are you based?
      </h1>
      <p className="onboarding-enter onboarding-enter-d2 mt-2 shrink-0 text-sm text-pocket-muted">
        We&apos;ll lightly prioritise local news and markets — nothing important
        gets hidden.
      </p>

      <div className="onboarding-enter onboarding-enter-d2 relative mt-5 shrink-0">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search countries"
          className="w-full rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-4 py-3 text-[15px] text-pocket-text outline-none placeholder:text-pocket-muted focus:border-[#00C6C6]/60"
        />
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="space-y-1.5">
          {regions.map((item) => {
            const active = selected === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all duration-200 active:scale-[0.99]"
                style={{
                  background: active
                    ? "linear-gradient(165deg, rgba(59,110,245,0.08) 0%, rgba(0,198,198,0.10) 100%)"
                    : "transparent",
                  border: active
                    ? "1.5px solid #00C6C6"
                    : "1px solid transparent",
                }}
              >
                <MarketFlag
                  countryCode={item.countryCode}
                  size={28}
                  rounded="lg"
                />
                <span className="min-w-0 flex-1 text-[15px] font-semibold text-pocket-text">
                  {item.label}
                </span>
                <span className="shrink-0 text-[12px] font-medium tabular-nums text-pocket-muted">
                  {item.currency}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    active
                      ? "border-[#00C6C6] bg-[#00C6C6]"
                      : "border-[var(--pocket-border)] bg-transparent"
                  }`}
                  aria-hidden
                >
                  {active && (
                    <Check className="h-3 w-3 text-black" strokeWidth={3} />
                  )}
                </span>
              </button>
            );
          })}
          {regions.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-pocket-muted">
              No countries match &ldquo;{query.trim()}&rdquo;
            </p>
          )}
        </div>
      </div>

      <p className="onboarding-enter onboarding-enter-d4 shrink-0 pb-3 text-center text-[12px] text-pocket-muted">
        Currency set to{" "}
        <span className="font-semibold text-pocket-text">{currency}</span>
        {" — "}
        change anytime in Settings
      </p>

      <div className="onboarding-enter onboarding-enter-d5 shrink-0">
        <GradientButton onClick={onNext}>Continue</GradientButton>
      </div>
    </div>
  );
}

function MarketsStep({
  selected,
  onToggle,
  onNext,
}: {
  selected: MarketFilter[];
  onToggle: (m: MarketFilter) => void;
  onNext: () => void;
}) {
  const markets = ONBOARDING_MARKETS.map((id) => getMarketById(id)).filter(
    (m): m is NonNullable<typeof m> => Boolean(m)
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <h1 className="onboarding-enter onboarding-enter-d1 shrink-0 text-2xl font-bold tracking-tight">
        Which markets do you follow?
      </h1>
      <p className="onboarding-enter onboarding-enter-d2 mt-2 shrink-0 text-sm text-pocket-muted">
        Pick a few — we&apos;ll personalise For You. You can change this later.
      </p>
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="onboarding-pref-grid">
          {markets.map((m, index) => {
            const active = selected.includes(m.id);
            return (
              <div
                key={m.id}
                className="onboarding-stagger"
                style={{ ["--ob-i" as string]: index }}
              >
                <SelectTile
                  active={active}
                  onClick={() => onToggle(m.id)}
                  label={m.name}
                  sub={m.country}
                  flagCode={m.countryCode}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="onboarding-enter onboarding-enter-d5 shrink-0 pt-2">
        <GradientButton onClick={onNext} disabled={selected.length === 0}>
          Continue
        </GradientButton>
      </div>
    </div>
  );
}

function SectorsStep({
  selected,
  onToggle,
  onNext,
}: {
  selected: SectorFilter[];
  onToggle: (s: SectorFilter) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <h1 className="onboarding-enter onboarding-enter-d1 shrink-0 text-2xl font-bold tracking-tight">
        What sectors interest you?
      </h1>
      <p className="onboarding-enter onboarding-enter-d2 mt-2 shrink-0 text-sm text-pocket-muted">
        Select at least one so we can personalise stories and Browse.
      </p>
      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="onboarding-pref-grid">
          {SECTOR_FILTERS.map((sector, index) => {
            const active = selected.includes(sector);
            return (
              <div
                key={sector}
                className="onboarding-stagger"
                style={{ ["--ob-i" as string]: index }}
              >
                <SelectTile
                  active={active}
                  onClick={() => onToggle(sector)}
                  label={sector}
                  icon={SECTOR_ICONS[sector]}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="onboarding-enter onboarding-enter-d5 shrink-0 pt-2">
        <GradientButton onClick={onNext} disabled={selected.length === 0}>
          Continue
        </GradientButton>
      </div>
    </div>
  );
}

function ReadyStep({
  region,
  currency,
  markets,
  sectors,
  onFinish,
}: {
  region: AppRegionId;
  currency: AppCurrency;
  markets: MarketFilter[];
  sectors: SectorFilter[];
  onFinish: () => void;
}) {
  const tips = [
    {
      title: "Pocket Briefing",
      body: "AI snapshot inside each article",
    },
    {
      title: "Browse",
      body: "Companies, markets, and crypto",
    },
    {
      title: "Profile",
      body: "Streak, level, and achievements",
    },
  ] as const;

  return (
    <div className="flex flex-1 flex-col px-6 pb-10">
      <div className="pt-2 text-center">
        <div className="onboarding-enter onboarding-enter-d1 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#00C6C6]/15">
          <span className="onboarding-soft-pulse inline-flex">
            <Check className="h-7 w-7 text-[#00C6C6]" strokeWidth={2.75} />
          </span>
        </div>
        <h1 className="onboarding-enter onboarding-enter-d2 text-2xl font-bold tracking-tight">
          You&apos;re set
        </h1>
        <p className="onboarding-enter onboarding-enter-d3 mt-2 text-sm text-pocket-muted">
          Your For You feed is ready. Here&apos;s what else to try.
        </p>
      </div>

      <div className="onboarding-enter onboarding-enter-d4 mt-6 space-y-3 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-4 py-4">
        <SummaryBlock
          title="Region"
          items={[`${getAppRegion(region).label} · ${currency}`]}
        />
        <SummaryBlock
          title="Markets"
          items={markets.map((id) => getMarketById(id)?.name ?? id)}
        />
        <SummaryBlock title="Sectors" items={[...sectors]} />
      </div>

      <ul className="mt-5 space-y-3 px-0.5">
        {tips.map((tip, index) => (
          <li
            key={tip.title}
            className="onboarding-stagger flex gap-3"
            style={{ ["--ob-i" as string]: index + 2 }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pocket-teal" />
            <p className="text-[13px] leading-snug text-pocket-muted">
              <span className="font-semibold text-pocket-text">{tip.title}</span>
              {" — "}
              {tip.body}
            </p>
          </li>
        ))}
      </ul>

      <div className="flex-1" />
      <div className="onboarding-enter onboarding-enter-d6">
        <GradientButton onClick={onFinish}>Start reading</GradientButton>
      </div>
    </div>
  );
}

function OnboardingOutro({
  region,
  markets,
  sectors,
}: {
  region: AppRegionId;
  markets: MarketFilter[];
  sectors: SectorFilter[];
}) {
  const marketLabel =
    markets
      .map((id) => getMarketById(id)?.name ?? id)
      .slice(0, 2)
      .join(" · ") || "your markets";
  const sectorLabel = sectors.slice(0, 2).join(" · ") || "your interests";

  return (
    <div
      className="onboarding-outro absolute inset-0 z-20 flex flex-col items-center justify-center px-8 text-center"
      aria-live="polite"
    >
      <div className="relative mb-7 flex h-24 w-24 items-center justify-center">
        <span className="onboarding-outro-ring absolute inset-0 rounded-full border-2 border-[#00C6C6]/50" />
        <span className="onboarding-outro-ring onboarding-outro-ring-delay absolute inset-0 rounded-full border border-[#3B6EF5]/40" />
        <span className="onboarding-outro-check relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#3B6EF5] to-[#00C6C6] shadow-[0_12px_40px_rgba(0,198,198,0.35)]">
          <Check className="h-10 w-10 text-white" strokeWidth={2.75} />
        </span>
      </div>

      <h2 className="onboarding-outro-title text-[28px] font-extrabold tracking-tight text-pocket-text">
        You&apos;re in
      </h2>
      <p className="onboarding-outro-copy mt-3 max-w-[280px] text-[14px] leading-relaxed text-pocket-muted">
        Personalising For You around {getAppRegion(region).label}, {marketLabel}{" "}
        and {sectorLabel}.
      </p>
    </div>
  );
}

function SummaryBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-pocket-muted">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[#00C6C6]/40 bg-[#00C6C6]/10 px-3 py-1 text-xs font-medium text-[#00C6C6]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SelectTile({
  active,
  onClick,
  label,
  sub,
  flagCode,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  flagCode?: string;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="onboarding-pref-tile relative"
      style={{
        background: active
          ? "linear-gradient(165deg, rgba(59,110,245,0.05) 0%, rgba(0,198,198,0.10) 100%)"
          : "var(--pocket-card)",
        border: active
          ? "1.5px solid #00C6C6"
          : "1px solid var(--pocket-border)",
        boxShadow: active ? "0 0 20px rgba(0,198,198,0.25)" : undefined,
      }}
    >
      {active && (
        <span
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#00C6C6]"
          aria-hidden
        >
          <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />
        </span>
      )}

      <div className="shrink-0">
        {flagCode ? (
          <MarketFlag countryCode={flagCode} size={24} rounded="lg" />
        ) : Icon ? (
          <Icon
            className={`h-6 w-6 ${active ? "text-[#00C6C6]" : "text-pocket-muted"}`}
            strokeWidth={1.5}
          />
        ) : null}
      </div>

      <div className="mt-auto min-w-0 pr-6 pt-3">
        <span className="block truncate text-[14px] font-semibold leading-tight text-pocket-text">
          {label}
        </span>
        {sub ? (
          <span className="mt-0.5 block truncate text-xs leading-snug text-pocket-muted">
            {sub}
          </span>
        ) : (
          <span className="mt-0.5 block h-4" aria-hidden />
        )}
      </div>
    </button>
  );
}

function GradientButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl py-4 text-base font-bold transition-all duration-200 active:scale-[0.98] ${
        disabled
          ? "cursor-not-allowed bg-[var(--pocket-surface-hover)] text-pocket-muted shadow-none"
          : "onboarding-cta-glow bg-gradient-to-r from-[#3B6EF5] via-[#4A7EF6] to-[#00C6C6] text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)]"
      }`}
    >
      {children}
    </button>
  );
}
