import type { Metadata } from "next";
import { ForceDarkTheme } from "@/components/ForceDarkTheme";
import { LegalPageShell, LegalSection } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service — Pocket Finance",
  description: "The terms that govern your use of Pocket Finance.",
};

const LAST_UPDATED = "July 2026";
const CONTACT_EMAIL = "support@pocketfinance.app";

export default function TermsOfServicePage() {
  return (
    <ForceDarkTheme>
      <LegalPageShell title="Terms of Service" lastUpdated={LAST_UPDATED}>
        <LegalSection title="Agreement to terms">
          <p>
            By creating an account or using Pocket Finance as a guest, you
            agree to these terms. If you don&apos;t agree, please don&apos;t
            use the app.
          </p>
        </LegalSection>

        <LegalSection title="Not financial advice">
          <p>
            Pocket Finance is a news app. It does not display live or
            real-time stock prices, execute trades, or manage money. Nothing
            in the app — including headlines, sentiment indicators, AI-written
            summaries, or company information — is financial, investment,
            legal, or tax advice. Sentiment shown on the app reflects the tone
            of news coverage, not a prediction or recommendation. Always do
            your own research and consult a licensed professional before
            making financial decisions.
          </p>
        </LegalSection>

        <LegalSection title="Your account">
          <p>
            You&apos;re responsible for keeping your password secure and for
            everything that happens under your account. You must provide
            accurate information when signing up, and you must be old enough
            to legally use an app like this in your country.
          </p>
          <p>
            You can use Pocket Finance without an account in Guest mode, with
            reduced functionality (comments, likes, saves, and follows
            require an account).
          </p>
        </LegalSection>

        <LegalSection title="Your content">
          <p>
            You own whatever you post — comments, reactions, and the like.
            By posting, you give Pocket Finance a license to display it
            within the app. You&apos;re responsible for what you post, and it
            must not be illegal, harassing, hateful, spam, or otherwise
            abusive. We reserve the right to remove content or suspend
            accounts that violate this, including through the in-app report
            feature and basic automated filtering.
          </p>
        </LegalSection>

        <LegalSection title="Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>Use the app for anything illegal or harmful.</li>
            <li>
              Attempt to access another user&apos;s account or data without
              permission.
            </li>
            <li>
              Scrape, reverse-engineer, or abuse the app&apos;s
              infrastructure beyond normal personal use.
            </li>
            <li>
              Impersonate another person or misrepresent your affiliation
              with anyone.
            </li>
          </ul>
        </LegalSection>

        <LegalSection title="Third-party content">
          <p>
            News articles, images, and data shown in Pocket Finance come from
            third-party publishers and data providers.
            We don&apos;t control and aren&apos;t responsible for the
            accuracy of third-party content — we link to and summarize it,
            we don&apos;t author it.
          </p>
        </LegalSection>

        <LegalSection title="Account termination">
          <p>
            You can delete your account at any time from Settings → Account
            → Delete Account — this is immediate and permanent. We may
            suspend or terminate accounts that violate these terms, with or
            without notice.
          </p>
        </LegalSection>

        <LegalSection title="Disclaimers and limitation of liability">
          <p>
            Pocket Finance is provided &quot;as is,&quot; without warranties
            of any kind. We don&apos;t guarantee the app will be
            uninterrupted, error-free, or that any information in it is
            accurate or complete. To the fullest extent permitted by law,
            Pocket Finance isn&apos;t liable for any financial or other
            losses arising from your use of the app or reliance on
            information in it.
          </p>
        </LegalSection>

        <LegalSection title="Changes to these terms">
          <p>
            We may update these terms from time to time. If we make material
            changes, we&apos;ll update the date at the top of this page.
            Continuing to use Pocket Finance after a change means you accept
            the updated terms.
          </p>
        </LegalSection>

        <LegalSection title="Contact">
          <p>
            Questions about these terms:{" "}
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
