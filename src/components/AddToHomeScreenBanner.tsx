"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { BOTTOM_NAV_PX } from "@/lib/layout";

const DISMISS_KEY = "pocket-a2hs-dismissed";

function isIosSafariBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isInstalled =
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  if (isInstalled) return false;

  const ua = nav.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  if (!isIos) return false;

  const isOtherIosBrowser = /crios|fxios|edgios|opios/i.test(ua);
  return !isOtherIosBrowser;
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DISMISS_KEY) === "true";
}

export function AddToHomeScreenBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIosSafariBrowser() && !isDismissed()) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="pointer-events-auto fixed left-0 right-0 z-[45] mx-auto max-w-mobile px-3"
      style={{ bottom: BOTTOM_NAV_PX }}
      data-no-drag
      data-interactive
    >
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-lg"
        style={{
          background: "linear-gradient(135deg, #3B6EF5 0%, #00C6C6 100%)",
        }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            Add to Home Screen for the best experience
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/90">
            <Share className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            Tap share → Add to Home Screen
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-white active:bg-black/30"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
