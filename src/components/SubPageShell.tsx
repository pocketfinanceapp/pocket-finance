"use client";

import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  PANEL_EXIT_MS,
  panelEnterStyle,
  tabEnterFadeStyle,
  TAB_EXIT_EASE,
  TAB_ENTER_EASE,
} from "@/lib/tabEnterAnimation";

interface SubPageShellProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

/** Full-screen sub-page with enter + exit slide/fade (profile, settings, etc.). */
export function SubPageShell({
  open,
  title,
  onClose,
  children,
  contentClassName = "min-h-0 flex-1 overflow-y-auto px-5 pt-4",
  contentStyle,
}: SubPageShellProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), PANEL_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleBack = () => {
    setVisible(false);
    window.setTimeout(onClose, PANEL_EXIT_MS);
  };

  if (!mounted) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex h-full min-h-0 flex-col bg-pocket-bg pf-page"
      style={panelEnterStyle(visible)}
    >
      <div style={tabEnterFadeStyle(visible, 0)}>
        <ScreenHeader title={title} onBack={handleBack} />
      </div>
      <div
        className={contentClassName}
        style={{
          paddingBottom: "calc(9rem + env(safe-area-inset-bottom))",
          ...tabEnterFadeStyle(visible, 90),
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface OverlayPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Slide-in overlay panel (company detail, etc.). */
export function OverlayPanel({
  open,
  onClose,
  children,
  className = "",
}: OverlayPanelProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), PANEL_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`absolute inset-0 z-50 h-full w-full bg-pocket-bg ${className}`}
      style={panelEnterStyle(visible)}
    >
      {children}
    </div>
  );
}

/** Fade wrapper for inline sections (auth, settings rows, etc.). */
export function FadeInSection({
  active = true,
  delayMs = 0,
  children,
  className = "",
}: {
  active?: boolean;
  delayMs?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [active]);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: visible
          ? `opacity 480ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 560ms ${TAB_ENTER_EASE} ${delayMs}ms`
          : `opacity 280ms ${TAB_EXIT_EASE}, transform 320ms ${TAB_EXIT_EASE}`,
      }}
    >
      {children}
    </div>
  );
}
