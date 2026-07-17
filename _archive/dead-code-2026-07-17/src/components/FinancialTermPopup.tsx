"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Lightbulb, Sigma } from "lucide-react";

export interface ExplanationContent {
  displayName: string;
  explanation: string;
  formula?: string;
  tip?: string;
  rangeGuide?: string;
}

interface FinancialTermPopupProps {
  term: ExplanationContent | null;
  onClose: () => void;
}

export function FinancialTermPopup({ term, onClose }: FinancialTermPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!term) {
      setOpen(false);
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, [term]);

  if (!mounted || !term) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      data-no-drag
      data-interactive
    >
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`relative mx-auto w-full max-w-mobile rounded-t-2xl border border-[var(--pocket-border)] bg-pocket-bg shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-center pt-3">
          <span className="h-1 w-10 rounded-full bg-white/15" aria-hidden />
        </div>

        <div className="max-h-[min(72vh,560px)] overflow-y-auto px-5 pb-2 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pocket-teal">
            Learn
          </p>
          <h3 className="mt-1 text-[20px] font-bold tracking-tight text-pocket-text">
            {term.displayName}
          </h3>

          <section className="mt-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-pocket-muted">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2.25} />
              <p className="text-[11px] font-semibold uppercase tracking-wide">
                What it means
              </p>
            </div>
            <p className="text-[14px] leading-relaxed text-pocket-text/90">
              {term.explanation}
            </p>
          </section>

          {term.formula && (
            <section className="mt-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-pocket-muted">
                <Sigma className="h-3.5 w-3.5" strokeWidth={2.25} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">
                  Formula
                </p>
              </div>
              <div className="rounded-xl border border-[#00C6C6]/25 bg-[#00C6C6]/08 px-3.5 py-3">
                <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-[#7EEAEA]">
                  {term.formula}
                </pre>
              </div>
            </section>
          )}

          {term.tip && (
            <section className="mt-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-pocket-muted">
                <Lightbulb className="h-3.5 w-3.5" strokeWidth={2.25} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">
                  How to use it
                </p>
              </div>
              <p className="text-[13.5px] leading-relaxed text-pocket-muted">
                {term.tip}
              </p>
            </section>
          )}

          {term.rangeGuide && (
            <section className="mt-4 rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-pocket-muted">
                Quick guide
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-pocket-text/85">
                {term.rangeGuide}
              </p>
            </section>
          )}
        </div>

        <div className="border-t border-[var(--pocket-border)] px-5 py-4">
          <button
            type="button"
            data-no-drag
            data-interactive
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-3.5 text-[15px] font-bold text-white transition-transform active:scale-[0.98]"
            style={{ touchAction: "manipulation" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
