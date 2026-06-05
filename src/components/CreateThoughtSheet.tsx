"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";

interface CreateThoughtSheetProps {
  open: boolean;
  onClose: () => void;
  defaultTicker?: string;
}

export function CreateThoughtSheet({
  open,
  onClose,
  defaultTicker = "NVDA",
}: CreateThoughtSheetProps) {
  const [ticker, setTicker] = useState(defaultTicker);
  const [thought, setThought] = useState("");

  useEffect(() => {
    if (open) setTicker(defaultTicker);
  }, [open, defaultTicker]);

  const submit = () => {
    if (!thought.trim()) return;
    onClose();
    setThought("");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Share your take">
      <div className="space-y-4 px-5 pb-6">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Stock ticker
          </label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            data-no-drag
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-pocket-teal focus:outline-none focus:ring-1 focus:ring-pocket-teal/50"
            placeholder="NVDA"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Your thoughts
          </label>
          <textarea
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            rows={5}
            data-no-drag
            placeholder={`What's your view on $${ticker}?`}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-pocket-teal/50"
          />
        </div>
        <button
          type="button"
          data-no-drag
          onClick={submit}
          disabled={!thought.trim()}
          className="w-full rounded-xl bg-white py-3.5 text-sm font-bold text-black disabled:opacity-40 active:scale-[0.98]"
        >
          Post · ${ticker}
        </button>
      </div>
    </BottomSheet>
  );
}
