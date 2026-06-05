"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PocketMarkIcon } from "@/components/PocketLogo";
import { useApp } from "@/context/AppContext";
import {
  ONBOARDING_MARKETS,
  SECTOR_FILTERS,
  type MarketFilter,
  type SectorFilter,
} from "@/lib/filters";
import { getMarketById } from "@/lib/markets";

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
    <div className="fixed inset-0 z-[100] mx-auto flex min-h-screen min-h-[100dvh] w-full max-w-mobile flex-col bg-black text-white">
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
            i === current ? "w-6 bg-[#00C6C6]" : "w-1.5 bg-white/20"
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
          <div className="onboarding-enter onboarding-enter-d1 mb-10">
            <PocketMarkIcon size={120} glow="none" className="mx-auto" />
          </div>

          <h1 className="onboarding-enter onboarding-enter-d2 text-[34px] font-extrabold leading-tight tracking-tight text-white antialiased">
            Pocket Finance
          </h1>

          <p className="onboarding-enter onboarding-enter-d3 mt-3 bg-gradient-to-r from-[#3B6EF5] via-[#5B8EF7] to-[#00C6C6] bg-clip-text text-lg font-semibold tracking-wide text-transparent">
            Bold news. Smarter moves.
          </p>

          <p className="onboarding-enter onboarding-enter-d4 mt-5 max-w-[280px] text-[15px] leading-relaxed text-zinc-500">
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
      <p className="mt-2 text-sm text-zinc-500">
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
              emoji={m.flag}
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
      <p className="mt-2 text-sm text-zinc-500">
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
            />
          );
        })}
      </div>
      <div className="flex-1" />
      <GradientButton onClick={onNext}>Continue</GradientButton>
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
        <p className="mt-2 text-sm text-zinc-500">
          Tailored to the markets and sectors you chose.
        </p>
      </div>

      <div className="mb-8 space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
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
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  emoji?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.98] ${
        active
          ? "border-[#3B6EF5]/50 bg-gradient-to-br from-[#3B6EF5]/15 to-[#00C6C6]/10 shadow-[0_0_20px_rgba(59,110,245,0.12)]"
          : "border-white/[0.1] bg-white/[0.03]"
      }`}
    >
      {emoji && <span className="text-2xl leading-none">{emoji}</span>}
      <span
        className={`font-semibold ${emoji ? "mt-2" : ""} ${
          active ? "text-white" : "text-zinc-200"
        }`}
      >
        {label}
      </span>
      {sub && <span className="mt-0.5 text-[11px] text-zinc-500">{sub}</span>}
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
      className="w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-4 text-base font-bold text-white shadow-[0_8px_32px_rgba(59,110,245,0.35)] transition-opacity active:scale-[0.99] disabled:opacity-40"
    >
      {children}
    </button>
  );
}
