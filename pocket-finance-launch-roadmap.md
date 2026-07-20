# Pocket Finance — Launch Roadmap

Everything that needs to happen before launch, organized into four tracks that run in parallel rather than one long sequential list. Most of the calendar time here is waiting (DNS propagation, app store review, developer account approval), not build time — so the fastest path is starting the "waiting" items early while the code work happens alongside.

Owner key: **[You]** = account/vendor action only I can't do for you · **[Me]** = code I write directly · **[Both]** = needs your input plus my execution.

---

## Track A — Legal pages & account deletion
*Blocks: both app store submissions. Nothing else depends on this, so it can start immediately.*

| Step | Owner | Notes |
|---|---|---|
| ✅ Write Privacy Policy page | Me | Live at /privacy. |
| ✅ Write Terms of Service page | Me | Live at /terms. |
| ✅ Link both from login/signup screen | Me | Linked from the auth screen's terms footer. |
| ✅ In-app account deletion flow | Me | Server route + Settings UI built, verified live via email flow testing. |

**Estimate:** one focused build session. No external waiting time — this is the fastest track to close out.

---

## Track B — Trust & infrastructure cleanup
*Mostly vendor/account actions on your end. The custom domain is the dependency almost everything else in this track hangs off of.*

| Step | Owner | Notes |
|---|---|---|
| ✅ Buy a custom domain | You | Prerequisite for trustworthy auth emails and a real app store listing (support URL, marketing URL). Do this first — everything else in this track waits on it. |
| ✅ Point domain at Vercel | Both | Quick once you own the domain; I can walk you through the DNS records. |
| ✅ Sign up for Resend (or similar) | You | For custom SMTP so auth emails come from your domain, not Supabase's shared sender. |
| ✅ Verify domain with Resend (SPF/DKIM/DMARC) | You | DNS records at your registrar — usually propagates within a few hours, occasionally up to 24h. |
| ✅ Wire Resend SMTP into Supabase | You | Authentication → Settings → SMTP Settings in the Supabase dashboard. |
| ✅ Rewrite Supabase email templates | Me | Signup confirmation + password reset copy, branded as Pocket Finance instead of the generic default. Verified live: confirmation email sent from noreply@pocketfinance.app, branded correctly, confirm link worked. |
| ✅ Upgrade Marketaux | You | Upgraded to the Standard plan (originally scoped as Basic — Marketaux's plan tiers/naming may have changed). Free plan's 100 req/day cap from background refreshes was already a real constraint, not optional scaling prep. |
| ✅ Confirm Vercel plan allows commercial use | You | Upgraded to Pro ($20/user/month, $20 included usage credit). Covers commercial use, plus faster builds and cold start prevention. |
| ☐ Check Twelve Data + Massive.com billing | You | Confirmed both were dead integrations — removed ~5,900 lines of unused code (components, API routes, lib files) tied to them. Massive has no payment method on file, nothing to do there. Twelve Data is still on a paid Venture plan ($149/mo) with nothing calling it anymore — cancel/downgrade it in your Twelve Data account billing settings. |
| ✅ Add error monitoring (Sentry) | Both | SDK wired in (client, server, edge, plus a global error boundary). You created the free Developer-plan account and connected GitHub. Still needed: add `NEXT_PUBLIC_SENTRY_DSN` to Vercel's environment variables so it's live in production. |

**Estimate:** domain purchase + DNS is the long pole here, mostly waiting (hours, sometimes up to a day). Everything else is a few hours of setup once the domain is live.

---

## Track C — App store packaging
*The genuinely long pole. Pocket Finance is currently a PWA, not a native app — this track is about closing that gap.*

| Step | Owner | Notes |
|---|---|---|
| Decide platform order | Both | Recommend **Android first** — Google Play accepts a wrapped PWA (Trusted Web Activity) with much less friction than Apple. iOS via Capacitor next. |
| Google Play Developer account | You | $25 one-time. Approval is typically same-day to ~48 hours. |
| Apple Developer Program | You | $99/year. Approval can take 24–48 hours, sometimes longer. |
| Build Android TWA wrapper | Me | Code work — packages the existing web app for Play Store distribution. |
| Build iOS Capacitor wrapper | Me | More involved than Android — new territory for this codebase, budget more back-and-forth and testing. |
| App store assets | Both | Icons, screenshots, description, keywords — I can generate/draft most of this, you'll want final approval. |
| Privacy "nutrition label" disclosure | Both | Both stores require accurately disclosing what data you collect — ties directly to the Privacy Policy from Track A. |
| Content rating questionnaire | You | Quick form on both platforms. |
| Submit to Google Play | You | Review is usually hours to ~1 day for a first submission. |
| Submit to Apple | You | A few days typically. Finance-category apps get closer scrutiny — budget for at least one rejection-and-resubmit round; this is normal, not a sign something's wrong. |

**Estimate:** this is where most of the real calendar time lives. Android could realistically be live within a couple of weeks of starting; iOS typically takes longer end-to-end because of Capacitor build work plus Apple's stricter, slower review.

---

## Track D — Final verification
*Runs right before flipping the switch, after Tracks A–C are done.*

- Full click-through of signup → email confirm → password reset → account deletion, using the real custom domain and email sender.
- Confirm RLS policies on every table (already partially in place from the comment/analytics work — worth one more pass).
- Typecheck/lint/build clean on the full app (standard practice we've been doing all session).
- Soft-launch to a small group before the public app store listing goes live, if you want a real-world check before wide release.

---

## What can start today, in parallel, with zero dependencies

1. **Me:** Privacy Policy, Terms of Service, account deletion flow (Track A).
2. **You:** Buy the domain, start the Marketaux upgrade, check your Vercel plan and Twelve Data/Massive billing (Track B, no domain-wait needed for the Marketaux/Vercel/billing items).
3. **You:** Kick off Apple Developer Program and Google Play Developer signups now — the approval wait is pure dead time, so starting early is free.

Everything else in Track B and C is sequenced behind the domain purchase and those two developer account approvals.
