"use client";

import { ArrowLeft } from "lucide-react";

interface ScreenHeaderProps {
  title: string;
  onBack: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <header className="pf-header-bar flex shrink-0 items-center gap-2 border-b border-[var(--pocket-border)] bg-pocket-bg px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <button
        type="button"
        data-no-drag
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-[var(--pocket-surface-hover)]"
        aria-label="Back"
        style={{ touchAction: "manipulation" }}
      >
        <ArrowLeft className="h-5 w-5 text-pocket-text" />
      </button>
      <h1 className="truncate text-lg font-bold text-pocket-text">{title}</h1>
    </header>
  );
}
