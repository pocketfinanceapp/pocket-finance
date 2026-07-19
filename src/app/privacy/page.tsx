import type { Metadata } from "next";
import { ForceDarkTheme } from "@/components/ForceDarkTheme";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Pocket Finance",
  description: "How Pocket Finance collects, uses, and protects your data.",
};

const LAST_UPDATED = "July 2026";
const CONTACT_EMAIL = "support@pocketfinance.app";

export default function PrivacyPolicyPage() {
  return (
    <ForceDarkTheme>
      <LegalPageShell title="Privacy Policy" lastUpdated={LAST_UPDATED}>
        <LegalSection title="The short version">
          <p>
            Pocket Finance is a finance news app. We collect the minimum
            needed to run your account and improve the app: your email and
            display name, whatever you post (comments, reactions, likes,
            saves, follows), and basic usage analytics. We never sell your
            data. You can delete your account and its data at any time from
            Settings.
          </p>
        </LegalSection>

        <LegalSection title="Information you provide">
          <p>
            When you create an account, we collect your email address, a
            display name, and a password (which we never see in plain text —
            it&apos;s handled entirely by our authentication provider,
            Supabase, using industry-standard hashing). If you sign in with
            Google or Apple instead, we receive the name and email address
            those providers share with us.
          </p>
          <p>
            You can also use Pocket Finance as a guest without creating an
            account. Guest mode doesn&apos;t create a server-side account —
            your preference is stored only on your device.
          </p>
          <p>
            Anything you post is stored against your account: comments,
            emoji reactions, comment reports you file, articles you like or
            save, and companies you follow.
          </p>
        </LegalSection>

        <LegalSection title="Information collected automatically">
          <p>
            We log basic usage events — which articles you read, which
            tickers you follow, when you post or react to a comment — tied
            to your account, so we can understand which features are
            actually useful and fix problems. This is internal-only; we
            don&apos;t share it with advertisers, and there is no
            advertising in Pocket Finance.
          </p>
          <p>
            We use Microsoft Clarity to record anonymized session behavior
            (things like scroll depth and tap patterns) so we can spot
            confusing parts of the app and fix them. Clarity doesn&apos;t
            receive your email, password, or the text of anything you post.
          </p>
        </LegalSection>

        <LegalSection title="Third parties we rely on">
          <p>
            Pocket Finance is built on a small number of infrastructure and
            data providers, each of which processes a limited slice of data
            to do its job:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> — hosts our database and handles
              authentication (including your password).
            </li>
            <li>
              <strong>Vercel</strong> — hosts the app itself.
            </li>
            <li>
              <strong>Marketaux and NewsAPI</strong> — supply the news
              articles you read. We don&apos;t send them any personal
              information about you.
            </li>
            <li>
              <strong>Anthropic (Claude)</strong> — generates the optional
              AI-written &quot;Pocket Briefing&quot; summary on article
              pages. Only the article&apos;s own text is sent, never
              anything about you personally.
            </li>
            <li>
              <strong>Microsoft Clarity</strong> — anonymized usage analytics,
              described above.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="What we don't do">
          <p>
            Pocket Finance does not display live stock prices, execute
            trades, or provide financial advice — it&apos;s a news app, and
            we design the product and this policy around that. We don&apos;t
            sell your personal data to third parties, and we don&apos;t run
            advertising.
          </p>
        </LegalSection>

        <LegalSection title="Your rights">
          <p>
            You can review and edit your display name, followed companies,
            liked and saved articles, and other preferences directly in the
            app under Settings at any time.
          </p>
          <p>
            You can permanently delete your account from Settings → Account
            → Delete Account. This removes your comments, reactions, reports,
            likes, saves, follows, and analytics history. Comments you
            posted are anonymized rather than erased outright when other
            people have replied to them, so that deleting your account
            doesn&apos;t also delete conversations other users are part of —
            your name and comment text are replaced, but the reply thread
            around it stays intact for everyone else. This deletion is
            immediate and cannot be undone.
          </p>
          <p>
            To request a copy of your data, or ask us anything about this
            policy, email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="Children's privacy">
          <p>
            Pocket Finance is not directed at children under 13, and we
            don&apos;t knowingly collect information from them. If you
            believe a child has created an account, contact us and
            we&apos;ll remove it.
          </p>
        </LegalSection>

        <LegalSection title="Changes to this policy">
          <p>
            If we make material changes to this policy, we&apos;ll update
            the date at the top of this page. Continued use of Pocket
            Finance after a change means you accept the updated policy.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Questions about this policy or your data:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </LegalSection>
      </LegalPageShell>
    </ForceDarkTheme>
  );
}
