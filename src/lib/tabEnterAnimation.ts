import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { NavTab } from "@/components/BottomNav";
import { useNavigationOptional } from "@/context/NavigationContext";

export const TAB_ENTER_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
export const TAB_EXIT_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export function tabEnterStyle(entered: boolean, delayMs = 0): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0) scale(1)" : "translateY(14px) scale(0.98)",
    transition: `opacity 600ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 720ms ${TAB_ENTER_EASE} ${delayMs}ms`,
    willChange: entered ? "auto" : "opacity, transform",
  };
}

export function tabEnterFadeStyle(entered: boolean, delayMs = 0): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(6px)",
    transition: `opacity 560ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 640ms ${TAB_ENTER_EASE} ${delayMs}ms`,
  };
}

/** Staggered card entrance for grids and lists. */
export function tabStaggerStyle(
  entered: boolean,
  index: number,
  baseDelayMs = 0
): CSSProperties {
  const delayMs = baseDelayMs + Math.min(index, 24) * 42;
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0) scale(1)" : "translateY(18px) scale(0.96)",
    transition: `opacity 580ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 700ms ${TAB_ENTER_EASE} ${delayMs}ms`,
  };
}

/** Slide + fade for full-screen panel transitions. */
export function panelEnterStyle(visible: boolean): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(28px)",
    transition: `opacity 420ms ${TAB_ENTER_EASE}, transform 520ms ${TAB_ENTER_EASE}`,
  };
}

function runTabEnterFrame(onEnter: () => void) {
  let raf2 = 0;
  const raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(onEnter);
  });

  return () => {
    cancelAnimationFrame(raf1);
    if (raf2) cancelAnimationFrame(raf2);
  };
}

/** Triggers a procedural enter animation when `active` becomes true. */
export function useTabEntered(active: boolean): boolean {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!active) {
      setEntered(false);
      return;
    }

    return runTabEnterFrame(() => setEntered(true));
  }, [active]);

  return entered;
}

/**
 * Enter animation for a shell tab. Pass `replayKey` to replay while the tab
 * stays active (e.g. browse category changes).
 */
export function useTabPageEntered(
  tab: NavTab,
  enabled = true,
  replayKey?: string | number | boolean | null
): boolean {
  const navigation = useNavigationOptional();
  const isActive = enabled && navigation?.activeTab === tab;
  const transitionKey = navigation?.transitionKey ?? 0;
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setEntered(false);
      return;
    }

    return runTabEnterFrame(() => setEntered(true));
  }, [isActive, replayKey, transitionKey]);

  return entered;
}
