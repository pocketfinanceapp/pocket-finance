import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { NavTab } from "@/components/BottomNav";
import { useNavigationOptional } from "@/context/NavigationContext";

export const TAB_ENTER_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function tabEnterStyle(entered: boolean, delayMs = 0): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 520ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 640ms ${TAB_ENTER_EASE} ${delayMs}ms`,
  };
}

export function tabEnterFadeStyle(entered: boolean, delayMs = 0): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transition: `opacity 520ms ${TAB_ENTER_EASE} ${delayMs}ms`,
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
