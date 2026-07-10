import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { NavTab } from "@/components/BottomNav";
import { useNavigationOptional } from "@/context/NavigationContext";

export const TAB_ENTER_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
export const TAB_EXIT_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export const PANEL_ENTER_MS = 520;
export const PANEL_EXIT_MS = 380;
export const LIST_FADE_OUT_MS = 220;
export const LIST_FADE_IN_MS = 480;

export function tabEnterStyle(entered: boolean, delayMs = 0): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0) scale(1)" : "translateY(14px) scale(0.98)",
    transition: entered
      ? `opacity 600ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 720ms ${TAB_ENTER_EASE} ${delayMs}ms`
      : `opacity 320ms ${TAB_EXIT_EASE} ${delayMs}ms, transform 360ms ${TAB_EXIT_EASE} ${delayMs}ms`,
    willChange: entered ? "auto" : "opacity, transform",
  };
}

export function tabEnterFadeStyle(entered: boolean, delayMs = 0): CSSProperties {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "translateY(0)" : "translateY(6px)",
    transition: entered
      ? `opacity 560ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 640ms ${TAB_ENTER_EASE} ${delayMs}ms`
      : `opacity 280ms ${TAB_EXIT_EASE} ${delayMs}ms, transform 320ms ${TAB_EXIT_EASE} ${delayMs}ms`,
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
    transition: entered
      ? `opacity 580ms ${TAB_ENTER_EASE} ${delayMs}ms, transform 700ms ${TAB_ENTER_EASE} ${delayMs}ms`
      : `opacity 260ms ${TAB_EXIT_EASE} ${Math.min(delayMs, 120)}ms, transform 320ms ${TAB_EXIT_EASE} ${Math.min(delayMs, 120)}ms`,
  };
}

/** Slide + fade for full-screen panel transitions (enter and exit). */
export function panelEnterStyle(visible: boolean): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(28px)",
    transition: visible
      ? `opacity 420ms ${TAB_ENTER_EASE}, transform ${PANEL_ENTER_MS}ms ${TAB_ENTER_EASE}`
      : `opacity 300ms ${TAB_EXIT_EASE}, transform ${PANEL_EXIT_MS}ms ${TAB_EXIT_EASE}`,
    willChange: visible ? "auto" : "opacity, transform",
  };
}

/** Main list layer fades while a detail panel opens or closes. */
export function listLayerStyle(visible: boolean): CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.99)",
    transition: visible
      ? `opacity ${LIST_FADE_IN_MS}ms ${TAB_ENTER_EASE}, transform 560ms ${TAB_ENTER_EASE}`
      : `opacity ${LIST_FADE_OUT_MS}ms ${TAB_EXIT_EASE}, transform 300ms ${TAB_EXIT_EASE}`,
    pointerEvents: visible ? "auto" : "none",
  };
}

export function usePanelTransition<T>() {
  const [panelItem, setPanelItem] = useState<T | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [listVisible, setListVisible] = useState(true);

  const openPanel = useCallback((item: T) => {
    setListVisible(false);
    window.setTimeout(() => {
      setPanelItem(item);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setPanelVisible(true));
      });
    }, LIST_FADE_OUT_MS);
  }, []);

  const closePanel = useCallback(() => {
    setPanelVisible(false);
    window.setTimeout(() => {
      setPanelItem(null);
      window.requestAnimationFrame(() => setListVisible(true));
    }, PANEL_EXIT_MS);
  }, []);

  return {
    panelItem,
    panelVisible,
    listVisible,
    openPanel,
    closePanel,
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
