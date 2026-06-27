"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Fixed footer outside scroll area (e.g. comment input) */
  footer?: ReactNode;
  tall?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  tall,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = "hidden";

      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });

      return () => cancelAnimationFrame(raf);
    }

    setEntered(false);
    document.body.style.overflow = "";
    const t = window.setTimeout(() => setMounted(false), 200);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      data-no-drag
      data-interactive
    >
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`relative mx-auto flex w-full max-w-mobile flex-col rounded-t-3xl border-t border-white/10 bg-[#111111] shadow-2xl transition-transform ${
          entered
            ? "translate-y-0 duration-300 ease-out"
            : "translate-y-full duration-200 ease-in"
        } ${tall ? "max-h-[88dvh]" : "max-h-[75dvh]"}`}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        {title && (
          <div className="flex shrink-0 items-center justify-between px-5 pb-3">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              type="button"
              data-no-drag
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
        {footer ? (
          <div
            className="shrink-0 border-t border-white/10 bg-[#111111] px-4 pt-3"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >
            {footer}
          </div>
        ) : (
          <div style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }} />
        )}
      </div>
    </div>
  );
}
