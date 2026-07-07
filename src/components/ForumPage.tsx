"use client";

import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";

export function ForumPage() {
  const tabEntered = useTabPageEntered("forum");

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      <header
        className="shrink-0 px-5 pb-3"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          ...tabEnterStyle(tabEntered, 0),
        }}
      >
        <h1 className="text-[28px] font-bold tracking-tight text-pocket-text">Forum</h1>
      </header>

      <div
        className="flex flex-1 flex-col items-center justify-center px-8 pb-24"
        style={tabEnterStyle(tabEntered, 80)}
      >
        <p className="text-center text-[15px] font-medium text-pocket-muted">
          Community discussions are coming soon.
        </p>
      </div>
    </div>
  );
}
