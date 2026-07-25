# Play Console: Data Safety Form — Answer Key

Play Console asks these questions one screen at a time. Below is what to click through, based on what Pocket Finance actually collects (per `src/app/privacy/page.tsx` and the Sentry/Clarity integrations already wired into the app).

## Step 1: Does your app collect or share any required user data?
**Yes**

## Step 2: Data types to declare

### Personal info
- **Email address** — Collected, not shared. Not processed ephemerally (stored in Supabase). Required (account creation only — guest mode doesn't need it). Purpose: **Account management, App functionality**.
- **Name** — Collected (display name), not shared. Optional. Purpose: **App functionality**.

### App activity
- **App interactions** — Collected (articles read, likes, saves, follows, comment/reaction events), not shared. Optional (guest mode has reduced tracking). Purpose: **App functionality, Analytics**.
- **Other user-generated content** — Collected (comments, reports filed). Not shared with third parties — comments are visible to other users *within the app*, which Play's definition doesn't count as third-party sharing. Optional. Purpose: **App functionality**.

### App info and performance
- **Crash logs** — Collected via Sentry. Not shared. Not optional (automatic). Purpose: **App functionality** (bug fixing).
- **Diagnostics** — Collected via Sentry (performance data). Same as above.

Don't skip this category — it's easy to forget since it's not user-facing, but Sentry is genuinely wired into the app (`@sentry/nextjs`, configured in `src/sentry.server.config.ts` / `instrumentation-client.ts`). I checked the config: `sendDefaultPii` isn't set, which means it defaults to `false` in the SDK version you're on — so Sentry is *not* automatically capturing IP addresses or other PII alongside crash reports. Crash logs/diagnostics still needs to be declared, but you don't need to also declare Device/other IDs on Sentry's account.

### What NOT to declare
- No location data collected.
- No financial info collected (no payment methods, no linked bank/brokerage accounts — this app doesn't touch money).
- No photos/videos/audio/files collected.
- No contacts or calendar access.
- No advertising ID — there's no ad SDK in this app at all.

## Step 3: Data sharing
**Is any data shared with third parties?** No — Marketaux (news API) receives no personal data, only request metadata for the API call itself. Microsoft Clarity records anonymized session behavior (no email, password, or content). Sentry and Supabase are processors acting on your behalf, not third-party recipients under Play's definition — they don't need to be declared as "shared with."

## Step 4: Security practices
- **Is data encrypted in transit?** Yes (HTTPS everywhere, Supabase connections are TLS).
- **Do you provide a way for users to request data deletion?** Yes — in-app at Settings → Account → Delete Account, and via email (support@pocketfinance.app).

## Step 5: Independent security review
No, unless you've had one — leave unchecked.

---

# Play Console: Content Rating (IARC) Questionnaire — Answer Guide

The IARC questionnaire asks yes/no questions across several categories. Answer based on what's actually in the app:

- **Violence:** None. Answer No to all violence questions.
- **Sexuality:** None. Answer No.
- **Language (profanity):** The app doesn't generate or display profanity itself, but user comments could theoretically contain it — you have a profanity filter, but filters aren't 100% (nothing is). Answer honestly: select that user-generated text content exists and is moderated but not pre-screened before posting.
- **Controlled substances:** None referenced in-app.
- **Gambling:** None — this is a news app, no wagering, no simulated gambling.
- **User-generated content:** **Yes** — comments, reactions. This is the question that matters most here. Be upfront that users can post free-text comments, that you have automated filtering (profanity/spam) plus a report feature, but content isn't reviewed before it's visible.
- **Shares user location:** No.
- **Digital purchases:** No — there's no in-app purchase or subscription in this app currently.

**Likely outcome:** Given moderated-but-not-pre-screened user comments, expect a rating around **Teen (Play) / 12+ (Apple's equivalent scale)** rather than "Everyone" — that's normal for any app with free-text UGC, not a red flag. Answering "Everyone" to dodge this is the actual risk: Play can suspend a listing that's rated lower than its real content later.
