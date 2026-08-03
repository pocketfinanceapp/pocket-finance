import type { Metadata } from "next";
import { ForceDarkTheme } from "@/components/ForceDarkTheme";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Delete Your Account — Pocket Finance",
  description: "How to request deletion of your Pocket Finance account and data.",
};

const CONTACT_EMAIL = "support@pocketfinance.app";

export default function DeleteAccountPage() {
  return (
    <ForceDarkTheme>
      <LegalPageShell title="Delete Your Account" lastUpdated="August 2026">
        <LegalSection title="Delete in the app (fastest)">
          <p>
            Open Pocket Finance and go to Settings → Account → Delete
            Account, then confirm. Deletion is immediate and permanent — it
            removes your comments, reactions, reports, likes, saves,
            follows, and analytics history tied to your account. Comments
            you posted that others have replied to are anonymized rather
            than removed outright, so deleting your account doesn&apos;t
            also delete conversations other users are part of.
          </p>
        </LegalSection>

        <LegalSection title="Don't have the app installed?">
          <p>
            Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}?subject=Delete my account`} className="underline">
              {CONTACT_EMAIL}
            </a>{" "}
            from the address associated with your account and request
            deletion. We&apos;ll verify it&apos;s you and delete your
            account and associated data within 14 days.
          </p>
        </LegalSection>

        <LegalSection title="What gets deleted">
          <p>
            Your email, display name, password (managed by our
            authentication provider, Supabase), comments, reactions,
            reports, likes, saves, followed companies, and usage/analytics
            history tied to your account.
          </p>
        </LegalSection>

        <LegalSection title="Questions">
          <p>
            Contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
              {CONTACT_EMAIL}
            </a>{" "}
            — see our{" "}
            <a href="/privacy" className="underline">
              Privacy Policy
            </a>{" "}
            for more detail on how we handle your data.
          </p>
        </LegalSection>
      </LegalPageShell>
    </ForceDarkTheme>
  );
}
