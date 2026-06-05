"use client";

import { ArrowLeft } from "lucide-react";
import { PocketMarkIcon } from "./PocketLogo";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button
        type="button"
        data-no-drag
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
        aria-label="Back"
        style={{ touchAction: "manipulation" }}
      >
        <ArrowLeft className="h-6 w-6 text-white" />
      </button>
      <PocketMarkIcon size={28} glow="normal" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Pocket Finance
        </p>
        <h1 className="truncate text-lg font-bold text-white">{title}</h1>
      </div>
    </header>
  );
}
