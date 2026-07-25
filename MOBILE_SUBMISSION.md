# Shipping Pocket Finance to the App Store & Play Store

This repo now has a Capacitor wrapper (`android/`, `ios/`, `capacitor.config.ts`) that loads the live production site (pocketfinance.app) inside a native shell — same app, native icon/splash/status-bar, installable from both stores. Everything below is what's left, and it needs to happen on your machine since it needs your developer accounts and signing identity.

## 1. Create the developer accounts (you — this is the actual blocker)

- **Google Play Console:** https://play.google.com/console/signup — $25 one-time fee, ID verification, usually approved within a day or so.
- **Apple Developer Program:** https://developer.apple.com/programs/enroll/ — $99/year, ID verification, can take a few days especially first time.

Nothing below can be finished without these.

## 2. Android — build & submit (no Mac needed)

1. Pull this branch, then open the `android/` folder in **Android Studio** (free download).
2. Let Gradle sync finish on first open.
3. Build → Generate Signed Bundle/APK → **Android App Bundle (.aab)**. Android Studio will walk you through creating a new upload keystore if you don't have one — **back that keystore file up somewhere safe**, losing it means you can never update the app again under the same listing.
4. In Play Console: create the app, fill in the store listing using `app-store-listing-copy.md` (also in this repo), upload the `.aab`, complete the Data Safety and content-rating questionnaires, submit for review.
5. First review is typically same-day to a few days.

## 3. iOS — build & submit (needs your Mac + Xcode)

1. Pull this branch, then open `ios/App/App.xcworkspace` in **Xcode**.
2. Xcode → Settings → Accounts → sign in with your Apple Developer account.
3. Select the App target → Signing & Capabilities → set your Team, let Xcode manage signing automatically.
4. In App Store Connect, create the app record (bundle ID `com.pocketfinance.app`, matches `capacitor.config.ts`).
5. Product → Archive, then use the Organizer window to upload the build to App Store Connect.
6. Fill in the listing using `app-store-listing-copy.md`, attach screenshots, complete the age-rating questionnaire, submit for review.
7. Apple review is typically 1–3 days; first-time submissions occasionally get held up on Guideline 4.2 (Minimum Functionality) since this is a web-wrapped app — see the note in `app-store-listing-copy.md` under "App Review notes" for how to preempt that in your review submission notes.

## 4. What ships instantly vs. what needs a new store submission

Because the wrapper loads the live site instead of a bundled build, most changes (new features, bug fixes, content, styling) go live the moment you deploy to Vercel — no store review needed. You only need a new native build + store submission for:
- App icon or splash screen changes
- Changes to `capacitor.config.ts` or native plugins
- Adding new native functionality (push notifications, etc.)

## 5. Still needed before either submission is complete

- **Screenshots** — I can generate a set at the exact required pixel dimensions for both stores once you're ready; just ask.
- **App icon** — already generated from `public/logo.png`, composited onto the app's dark background. Take a look at `assets/icon.png` before you submit — swap it out first if you'd rather use something else.
- Test the actual native builds once you have them (push notifications aren't wired up yet — out of scope for this pass, happy to add later if you want them).
