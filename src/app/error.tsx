"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="app-shell-height flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center text-white"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="mt-2 max-w-sm text-sm text-zinc-400">
        Try reloading the app. If this keeps happening, restart the dev server
        with <code className="text-zinc-300">npm run dev:fast</code>.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-3 text-sm font-semibold text-white"
      >
        Reload app
      </button>
    </div>
  );
}
