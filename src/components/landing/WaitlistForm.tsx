"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(
        data.message === "already_joined"
          ? "You're already on the list — we'll be in touch soon."
          : "You're on the list! We'll notify you when Pocket Finance launches."
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          disabled={status === "loading" || status === "success"}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111] px-4 py-3.5 text-[15px] text-white placeholder:text-zinc-600 focus:border-[#3B6EF5] focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="shrink-0 rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-6 py-3.5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Join Waitlist"}
        </button>
      </div>
      {message ? (
        <p
          className={`mt-4 text-sm ${
            status === "error" ? "text-red-400" : "text-[#00C6C6]"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
