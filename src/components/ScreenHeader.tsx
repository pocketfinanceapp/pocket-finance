"use client";

import { ArrowLeft } from "lucide-react";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-black px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <button
        type="button"
        data-no-drag
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-white/10"
        aria-label="Back"
        style={{ touchAction: "manipulation" }}
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>
      <h1 className="truncate text-lg font-bold text-white">{title}</h1>
    </header>
  );
}
