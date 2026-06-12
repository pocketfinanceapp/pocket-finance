"use client";

import { useEffect } from "react";
interface ExplanationContent {
  displayName: string;
  explanation: string;
}

interface FinancialTermPopupProps {
  term: ExplanationContent | null;
  onClose: () => void;
}

export function FinancialTermPopup({ term, onClose }: FinancialTermPopupProps) {
  useEffect(() => {
    if (!term) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [term]);

  if (!term) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end"
      data-no-drag
      data-interactive
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        className="relative mx-auto w-full max-w-mobile rounded-t-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <h3 className="text-base font-bold text-white">{term.displayName}</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          {term.explanation}
        </p>
        <button
          type="button"
          data-no-drag
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-white/10 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          style={{ touchAction: "manipulation" }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
