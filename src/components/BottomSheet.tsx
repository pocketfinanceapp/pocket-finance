"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  tall?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  tall,
}: BottomSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      const t = setTimeout(() => setVisible(false), 320);
      document.body.style.overflow = "";
      return () => clearTimeout(t);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open && !visible) return null;

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
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`relative mx-auto w-full max-w-mobile rounded-t-3xl border-t border-white/10 bg-[#111111] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "translate-y-0" : "translate-y-full"
        } ${tall ? "max-h-[88dvh]" : "max-h-[75dvh]"}`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
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
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
