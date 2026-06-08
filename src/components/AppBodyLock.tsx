"use client";

import { useEffect } from "react";

/** Locks html/body scroll for full-screen app routes under /app. */
export function AppBodyLock() {
  useEffect(() => {
    document.documentElement.classList.add("app-route");
    return () => {
      document.documentElement.classList.remove("app-route");
    };
  }, []);

  return null;
}
