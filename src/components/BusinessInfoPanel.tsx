"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  User,
} from "lucide-react";
import type { CompanyInfo } from "@/lib/companyInfo";
import { getTickerMetaBySymbol } from "@/lib/tickerMap";
import type { NewsArticle } from "@/lib/types";
import { CompanyLogo } from "./CompanyLogo";
import { FadeInSection } from "./SubPageShell";

interface BusinessInfoPanelProps {
  article: NewsArticle | null;
  onBack: () => void;
}

interface Fact {
  icon: typeof User;
  label: string;
  value: string;
}

/**
 * "Swipe right for business info" — a small, glanceable fact box (CEO,
 * founded date, headquarters, parent company, industry) sourced from
 * Wikidata/Wikipedia. This replaces the old live stock panel; it's
 * deliberately not a dashboard and carries no price/financial data.
 */
export function BusinessInfoPanel({ article, onBack }: BusinessInfoPanelProps) {
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const ticker = article?.ticker ?? "";
  const meta = ticker ? getTickerMetaBySymbol(ticker) : null;
  const companyName = article?.companyName || meta?.companyName || ticker;

  useEffect(() => {
    if (!companyName || loadedFor === companyName) return;
    let cancelled = false;
    setLoading(true);

    fetch(`/api/company-info?company=${encodeURIComponent(companyName)}`)
      .then((res) => (res.ok ? res.json() : { info: null }))
      .then((data: { info?: CompanyInfo | null }) => {
        if (cancelled) return;
        setInfo(data.info ?? null);
        setLoadedFor(companyName);
      })
      .catch(() => {
        if (cancelled) return;
        setInfo(null);
        setLoadedFor(companyName);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyName, loadedFor]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const facts: Fact[] = [];
  if (info?.ceo) facts.push({ icon: User, label: "CEO", value: info.ceo });
  if (info?.founded) {
    facts.push({ icon: Calendar, label: "Founded", value: info.founded });
  }
  if (info?.headquarters) {
    facts.push({ icon: MapPin, label: "Headquarters", value: info.headquarters });
  }
  if (info?.parentOrganization) {
    facts.push({
      icon: Building2,
      label: "Parent company",
      value: info.parentOrganization,
    });
  } else if (info?.ownedBy) {
    facts.push({ icon: Building2, label: "Owned by", value: info.ownedBy });
  }
  if (info?.industry) {
    facts.push({ icon: Building2, label: "Industry", value: info.industry });
  }

  return (
    <div className="pf-page relative flex h-full flex-col bg-pocket-bg text-pocket-text">
      <FadeInSection key={ticker} className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            data-no-drag
            onPointerDown={stop}
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full active:bg-[var(--pocket-surface-hover)]"
            aria-label="Back"
            style={{ touchAction: "manipulation" }}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <p className="text-[13px] font-bold uppercase tracking-widest text-pocket-muted">
            About this company
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {!ticker ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="text-sm text-pocket-muted">
                No company linked to this story.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <CompanyLogo
                  ticker={ticker}
                  color={meta?.logoColor ?? "#3B6EF5"}
                  size={52}
                  shape="circle"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[18px] font-bold text-pocket-text">
                    {info?.companyName ?? companyName}
                  </p>
                  <p className="text-[12px] text-pocket-muted">{ticker.toUpperCase()}</p>
                </div>
              </div>

              {loading ? (
                <div className="mt-8 flex items-center justify-center py-10">
                  <p className="text-sm text-pocket-muted">Loading…</p>
                </div>
              ) : !info ? (
                <div className="mt-8 rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] p-5 text-center">
                  <p className="text-sm text-pocket-muted">
                    We don&apos;t have background info on {companyName} yet.
                  </p>
                </div>
              ) : (
                <>
                  {info.description && (
                    <p className="mt-5 text-[14px] leading-relaxed text-pocket-text">
                      {info.description}
                    </p>
                  )}

                  {facts.length > 0 && (
                    <div className="mt-5 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
                      {facts.map((fact) => (
                        <div
                          key={fact.label}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <fact.icon className="h-4 w-4 shrink-0 text-pocket-muted" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-pocket-muted">
                              {fact.label}
                            </p>
                            <p className="mt-0.5 truncate text-[13px] font-semibold text-pocket-text">
                              {fact.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {info.wikipediaUrl && (
                    <a
                      href={info.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-no-drag
                      className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-[var(--pocket-border)] px-4 py-3 text-[13px] font-semibold text-pocket-text active:bg-[var(--pocket-surface-hover)]"
                    >
                      Read more on Wikipedia
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <p className="mt-4 text-center text-[10px] text-pocket-muted">
                    Background info from Wikipedia — may not reflect recent changes.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </FadeInSection>
    </div>
  );
}
