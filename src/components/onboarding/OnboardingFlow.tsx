"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type Step = 0 | 1 | 2 | 3;

export function OnboardingFlow() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<Step>(0);
  const [transitioning, setTransitioning] = useState(false);
  const [markets, setMarkets] = useState<MarketFilter[]>([]);
  const [sectors, setSectors] = useState<SectorFilter[]>([]);

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const goTo = useCallback((next: Step) => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setTransitioning(true);
    transitionTimer.current = setTimeout(() => {
      setStep(next);
      setTransitioning(false);
      transitionTimer.current = null;
    }, 220);
  }, []);

  const toggleMarket = (m: MarketFilter) => {
    setMarkets((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const toggleSector = (s: SectorFilter) => {
    setSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const finish = () => {
    completeOnboarding(markets, sectors);
  };

  return (
    <div className="app-shell-height fixed inset-0 z-[100] mx-auto flex w-full max-w-mobile flex-col pf-theme-scope bg-pocket-bg text-pocket-text">
      <div className="flex justify-center px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <StepDots total={4} current={step} />
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col transition-transform duration-300 ease-out ${
          transitioning ? "translate-x-3" : "translate-x-0"
        }`}
      >
        {step === 0 && <WelcomeStep onNext={() => goTo(1)} />}
        {step === 1 && (
          <MarketsStep
            selected={markets}
            onToggle={toggleMarket}
            onNext={() => goTo(2)}
          />
        )}
        {step === 2 && (
          <SectorsStep
            selected={sectors}
            onToggle={toggleSector}
            onNext={() => goTo(3)}
          />
        )}
        {step === 3 && (
          <ReadyStep
            markets={markets}
            sectors={sectors}
            onFinish={finish}
          />
        )}
      </div>
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
            i === current ? "w-6 bg-[#00C6C6]" : "w-1.5 bg-[var(--pocket-surface-hover)]"
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
          <PocketMarkIcon
            size={120}
            glow="none"
            className="onboarding-enter onboarding-enter-d1 mx-auto mb-10"
          />

          <h1 className="onboarding-enter onboarding-enter-d2 text-[34px] font-extrabold leading-tight tracking-tight text-pocket-text antialiased">
            Pocket Finance
          </h1>

          <p className="onboarding-enter onboarding-enter-d3 mt-3 bg-gradient-to-r from-[#3B6EF5] via-[#5B8EF7] to-[#00C6C6] bg-clip-text text-lg font-semibold tracking-wide text-transparent">
            Bold news. Smarter moves.
          </p>

          <p className="onboarding-enter onboarding-enter-d4 mt-5 max-w-[280px] text-[15px] leading-relaxed text-pocket-muted">
            The world&apos;s markets in your pocket
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

function MarketsStep({
  selected,
  onToggle,
  onNext,
}: {
  selected: MarketFilter[];
  onToggle: (m: MarketFilter) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-6 pb-10">
      <h1 className="text-2xl font-bold tracking-tight">
        Which markets do you follow?
      </h1>
      <p className="mt-2 text-sm text-pocket-muted">
        Select at least one to personalise your feed.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {ONBOARDING_MARKETS.map((id) => {
          const m = getMarketById(id);
          if (!m) return null;
          const active = selected.includes(id);
          return (
            <SelectTile
              key={id}
              active={active}
              onClick={() => onToggle(id)}
              label={m.name}
              sub={m.country}
              flagCode={m.countryCode}
            />
          );
        })}
      </div>
      <div className="flex-1" />
      <GradientButton onClick={onNext} disabled={selected.length === 0}>
        Continue
      </GradientButton>
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
    <div className="flex flex-1 flex-col px-6 pb-10">
      <h1 className="text-2xl font-bold tracking-tight">
        What sectors interest you?
      </h1>
      <p className="mt-2 text-sm text-pocket-muted">
        We&apos;ll surface stories that match your interests.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {SECTOR_FILTERS.map((sector) => {
          const active = selected.includes(sector);
          return (
            <SelectTile
              key={sector}
              active={active}
              onClick={() => onToggle(sector)}
              label={sector}
              icon={SECTOR_ICONS[sector]}
            />
          );
        })}
      </div>
      <div className="flex-1" />
      <GradientButton onClick={onNext} disabled={selected.length === 0}>
        Continue
      </GradientButton>
    </div>
  );
}

function ReadyStep({
  markets,
  sectors,
  onFinish,
}: {
  markets: MarketFilter[];
  sectors: SectorFilter[];
  onFinish: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col px-6 pb-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#00C6C6]/15">
          <svg
            className="h-8 w-8 text-[#00C6C6]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Your feed is ready</h1>
        <p className="mt-2 text-sm text-pocket-muted">
          Tailored to the markets and sectors you chose.
        </p>
      </div>

      <div className="mb-8 space-y-4 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-4">
        <SummaryBlock
          title="Markets"
          items={markets.map((id) => getMarketById(id)?.name ?? id)}
        />
        <SummaryBlock title="Sectors" items={[...sectors]} />
      </div>

      <GradientButton onClick={onFinish}>Start Reading</GradientButton>
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
      className="relative flex min-h-[104px] flex-col rounded-[20px] p-5 text-left transition-all duration-200 active:scale-[0.98]"
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
          <MarketFlag countryCode={flagCode} size={28} rounded="lg" />
        ) : Icon ? (
          <Icon
            className={`h-6 w-6 ${active ? "text-[#00C6C6]" : "text-pocket-muted"}`}
            strokeWidth={1.5}
          />
        ) : null}
      </div>

      <div className="mt-auto pt-3">
        <span className="block text-[15px] font-semibold leading-tight text-pocket-text">
          {label}
        </span>
        {sub && (
          <span className="mt-0.5 block text-xs leading-snug text-pocket-muted">
            {sub}
          </span>
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
