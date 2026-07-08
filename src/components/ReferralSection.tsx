"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Gift, Share2, X } from "lucide-react";
import {
  copyReferralLink,
  ensureReferralCode,
  getReferralCount,
  getReferralLink,
  hasSeenReferralIntro,
  markReferralIntroSeen,
} from "@/lib/referral";
import { tabEnterStyle } from "@/lib/tabEnterAnimation";

interface ReferralSectionProps {
  userId: string;
  animateIn: boolean;
  enterDelay?: number;
}

export function ReferralSection({
  userId,
  animateIn,
  enterDelay = 40,
}: ReferralSectionProps) {
  const [code, setCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [userCode, count] = await Promise.all([
        ensureReferralCode(userId),
        getReferralCount(userId),
      ]);
      if (cancelled) return;
      setCode(userCode);
      setReferralCount(count);
      if (!hasSeenReferralIntro(userId)) {
        setShowIntro(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dismissIntro = useCallback(() => {
    markReferralIntroSeen(userId);
    setShowIntro(false);
  }, [userId]);

  const handleCopy = useCallback(async () => {
    if (!code) return;
    const ok = await copyReferralLink(code);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleShare = useCallback(async () => {
    if (!code) return;
    const link = getReferralLink(code);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join me on Pocket Finance",
          text: "Get bold market news and smarter moves — use my invite link.",
          url: link,
        });
        dismissIntro();
        return;
      }
    } catch {
      /* user cancelled share */
    }
    void handleCopy();
  }, [code, dismissIntro, handleCopy]);

  if (!code) return null;

  return (
    <section className="mt-3" style={tabEnterStyle(animateIn, enterDelay)}>
      {showIntro && (
        <div
          className="mb-3 overflow-hidden rounded-2xl border border-[#00C6C6]/35 bg-gradient-to-r from-[#3B6EF5]/20 to-[#00C6C6]/15 p-4"
          style={tabEnterStyle(animateIn, enterDelay + 20)}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00C6C6]/20">
              <Gift className="h-5 w-5 text-[#00C6C6]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-pocket-text">
                New: Refer friends, earn rewards
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-pocket-muted">
                Share your invite link. When friends join Pocket Finance, you
                both unlock bonus XP.
              </p>
            </div>
            <button
              type="button"
              data-no-drag
              onClick={dismissIntro}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-pocket-muted active:bg-[var(--pocket-surface-hover)]"
              aria-label="Dismiss referral intro"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="pf-card-surface overflow-hidden rounded-2xl border border-[var(--pocket-border)] p-4">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-[#00C6C6]" />
          <h3 className="text-[15px] font-bold text-pocket-text">
            Referral program
          </h3>
        </div>
        <p className="mt-1.5 text-[12px] text-pocket-muted">
          {referralCount === 0
            ? "Invite friends and start earning bonus XP."
            : `${referralCount} friend${referralCount === 1 ? "" : "s"} joined with your link.`}
        </p>

        <div className="mt-4 rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-pocket-muted">
            Your invite code
          </p>
          <p className="mt-1 font-mono text-[22px] font-bold tracking-wider text-pocket-text">
            {code}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            data-no-drag
            onClick={() => void handleCopy()}
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--pocket-border)] py-2.5 text-[13px] font-semibold text-pocket-text active:bg-[var(--pocket-surface-hover)]"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[#00C6C6]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            data-no-drag
            onClick={() => void handleShare()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] py-2.5 text-[13px] font-semibold text-white active:opacity-90"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </section>
  );
}
