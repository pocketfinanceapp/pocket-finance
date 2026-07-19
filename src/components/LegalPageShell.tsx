import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PocketBrand } from "@/components/PocketLogo";

interface LegalPageShellProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/** Shared chrome for standalone public legal pages (Privacy, Terms) —
 * reachable pre-login, outside the authenticated app shell. */
export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="pf-theme-scope min-h-screen bg-pocket-bg text-pocket-text">
      <div className="mx-auto w-full max-w-2xl px-6 pb-20 pt-8 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-pocket-muted active:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="mt-8 mb-2">
          <PocketBrand iconSize={40} glow="none" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-pocket-muted">
          Last updated {lastUpdated}
        </p>

        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight text-pocket-text">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-pocket-muted [&_a]:text-[#00C6C6] [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-pocket-text [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
