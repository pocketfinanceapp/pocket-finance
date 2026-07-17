"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ExternalLink,
  MapPin,
  Plus,
  Tag,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { CompanyInfo } from "@/lib/companyInfo";
import type { MarketauxSentimentPoint } from "@/lib/marketauxApi";
import { getTickerMetaBySymbol, isMacroOrCommodityTicker } from "@/lib/tickerMap";
import type { NewsArticle } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { CompanyLogo } from "./CompanyLogo";
import { SentimentBadge, sentimentLabel, type SentimentLabel } from "./SentimentBadge";
import { FadeInSection } from "./SubPageShell";

interface BusinessInfoPanelProps {
  article: NewsArticle | null;
  onBack: () => void;
}

interface Fact {
  icon: typeof Calendar;
  label: string;
  value: string;
}

function summarizeSentiment(
  points: MarketauxSentimentPoint[]
): { label: string; dominant: SentimentLabel } | null {
  const scores = points
    .map((p) => p.sentimentAvg)
    .filter((v): v is number => v !== null);
  if (scores.length === 0) return null;

  const counts: Record<SentimentLabel, number> = {
    bullish: 0,
    bearish: 0,
    neutral: 0,
  };
  for (const score of scores) counts[sentimentLabel(score)] += 1;

  const [dominant, dominantCount] = (
    Object.entries(counts) as [SentimentLabel, number][]
  ).sort((a, b) => b[1] - a[1])[0];

  const share = dominantCount / scores.length;
  const label = share >= 0.6 ? `mostly ${dominant}` : "mixed";
  return { label, dominant };
}

/**
 * "Swipe right for business info" — a small, glanceable fact box (founded
 * date, headquarters, parent company, industry) sourced from
 * Wikidata/Wikipedia, plus recent Marketaux headlines and a sentiment
 * summary. This replaces the old live stock panel; it's deliberately not a
 * dashboard and carries no price/financial data.
 *
 * CEO is intentionally omitted — Wikidata's chief-executive property is
 * unreliable (often shows former CEOs), so we don't surface it rather than
 * risk showing a wrong name.
 *
 * Macro/index/commodity tags (e.g. "Broad Market", "Crude Oil") aren't real
 * companies — there's no Wikidata entity, no founder/HQ/owner facts, and no
 * "Follow this company" relationship that makes sense. Rather than showing
 * the company-profile layout with an empty/broken-looking result, those
 * render a distinct, lightweight "topic" card instead.
 */
export function BusinessInfoPanel({ article, onBack }: BusinessInfoPanelProps) {
  const { toggleFollowTicker, isFollowingTicker, requestFeedJump } = useApp();
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<NewsArticle[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(false);
  const [sentimentPoints, setSentimentPoints] = useState<MarketauxSentimentPoint[]>(
    []
  );
  const [followToast, setFollowToast] = useState<string | null>(null);

  const ticker = article?.ticker ?? "";
  const isMacroTicker = ticker ? isMacroOrCommodityTicker(ticker) : false;
  const isCompanyTicker = Boolean(ticker) && !isMacroTicker;
  const meta = ticker ? getTickerMetaBySymbol(ticker) : null;
  const companyName = article?.companyName || meta?.companyName || ticker;
  const following = ticker ? isFollowingTicker(ticker) : false;

  useEffect(() => {
    if (!isCompanyTicker || !companyName || loadedFor === companyName) return;
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
  }, [isCompanyTicker, companyName, loadedFor]);

  // Recent Marketaux headlines for this entity — makes the panel feel alive
  // instead of a Wikipedia dead-end. Only fetched for real company tickers.
  useEffect(() => {
    if (!isCompanyTicker || !ticker) {
      setHeadlines([]);
      return;
    }
    let cancelled = false;
    setHeadlinesLoading(true);

    fetch(`/api/marketaux/entity-news?symbol=${encodeURIComponent(ticker)}&limit=5`)
      .then((res) => (res.ok ? res.json() : { articles: [] }))
      .then((data: { articles?: NewsArticle[] }) => {
        if (!cancelled) setHeadlines(data.articles ?? []);
      })
      .catch(() => {
        if (!cancelled) setHeadlines([]);
      })
      .finally(() => {
        if (!cancelled) setHeadlinesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isCompanyTicker, ticker]);

  // Aggregate sentiment across recent coverage — reuses the same
  // entity-stats endpoint that powers the Explore ticker detail chart.
  useEffect(() => {
    if (!isCompanyTicker || !ticker) {
      setSentimentPoints([]);
      return;
    }
    let cancelled = false;

    fetch(`/api/marketaux/entity-stats?symbol=${encodeURIComponent(ticker)}&days=14`)
      .then((res) => (res.ok ? res.json() : { points: [] }))
      .then((data: { points?: MarketauxSentimentPoint[] }) => {
        if (!cancelled) setSentimentPoints(data.points ?? []);
      })
      .catch(() => {
        if (!cancelled) setSentimentPoints([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isCompanyTicker, ticker]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const facts: Fact[] = [];
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

  // Sparse Wikidata coverage (e.g. a smaller ASX-listed name with only an
  // "Industry" field) reads as broken rather than expected — call it out
  // explicitly instead of leaving a near-empty card.
  const isMinimalInfo = Boolean(info) && !info?.description && facts.length <= 1;

  const sentimentSummary = summarizeSentiment(sentimentPoints);

  const handleFollow = () => {
    if (!ticker) return;
    const wasFollowing = following;
    toggleFollowTicker(ticker);
    setFollowToast(
      wasFollowing
        ? `Unfollowed ${ticker.toUpperCase()}`
        : `Following ${ticker.toUpperCase()} — more stories like this in your feed`
    );
    window.setTimeout(() => setFollowToast(null), 2200);
  };

  const openHeadline = (headline: NewsArticle) => {
    requestFeedJump(headline.id);
    onBack();
  };

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
            {isMacroTicker ? "About this topic" : "About this company"}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {!ticker ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="text-sm text-pocket-muted">
                No company linked to this story.
              </p>
            </div>
          ) : isMacroTicker ? (
            <div className="flex flex-col items-center px-2 pt-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
                <Tag className="h-7 w-7 text-pocket-muted" strokeWidth={1.75} />
              </div>
              <p className="mt-4 text-[17px] font-bold text-pocket-text">
                {companyName}
              </p>
              <p className="mt-2 max-w-[26rem] text-[13px] leading-relaxed text-pocket-muted">
                This story is tagged under a market theme rather than a
                specific company, so there&apos;s no company profile to show
                here.
              </p>
              <button
                type="button"
                data-no-drag
                onPointerDown={stop}
                onClick={onBack}
                className="mt-6 rounded-2xl border border-[var(--pocket-border)] px-5 py-3 text-[13px] font-semibold text-pocket-text active:bg-[var(--pocket-surface-hover)]"
              >
                Back to the story
              </button>
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
                <button
                  type="button"
                  data-no-drag
                  onPointerDown={stop}
                  onClick={handleFollow}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors active:opacity-70 ${
                    following
                      ? "border-[#00C6C6]/35 bg-[#00C6C6]/14 text-[#00C6C6]"
                      : "border-[var(--pocket-border)] text-pocket-text"
                  }`}
                >
                  {following ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                  {following ? "Following" : "Follow"}
                </button>
              </div>

              {followToast && (
                <p
                  className="mt-3 rounded-xl border border-[#00C6C6]/25 bg-[#00C6C6]/10 px-3 py-2 text-center text-[12px] font-medium text-[#00C6C6]"
                  data-no-drag
                >
                  {followToast}
                </p>
              )}

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

                  {isMinimalInfo && (
                    <p className="mt-3 text-center text-[12px] text-pocket-muted">
                      Limited public info available for this company.
                    </p>
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

              {sentimentSummary && (
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-4 py-3">
                  <p className="text-[12px] text-pocket-muted">
                    Sentiment across recent coverage:{" "}
                    <span className="font-semibold text-pocket-text">
                      {sentimentSummary.label}
                    </span>
                  </p>
                  <SentimentBadge
                    score={
                      sentimentSummary.dominant === "bullish"
                        ? 0.5
                        : sentimentSummary.dominant === "bearish"
                          ? -0.5
                          : 0
                    }
                    size="xs"
                  />
                </div>
              )}

              {(headlinesLoading || headlines.length > 0) && (
                <div className="mt-6">
                  <h2 className="text-[12px] font-bold uppercase tracking-widest text-pocket-muted">
                    Recent headlines
                  </h2>
                  {headlinesLoading ? (
                    <div className="mt-3 flex items-center justify-center py-6">
                      <p className="text-[12px] text-pocket-muted">Loading…</p>
                    </div>
                  ) : (
                    <ul className="mt-3 divide-y divide-[var(--pocket-border)] overflow-hidden rounded-2xl border border-[var(--pocket-border)] bg-[var(--pocket-card)]">
                      {headlines.map((headline) => (
                        <li key={headline.id}>
                          <button
                            type="button"
                            data-no-drag
                            onPointerDown={stop}
                            onClick={() => openHeadline(headline)}
                            className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-[var(--pocket-surface-hover)]"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-pocket-text">
                                {headline.headline}
                              </p>
                              <p className="mt-1 text-[11px] text-pocket-muted">
                                {headline.sourceName} · {timeAgo(headline.publishedAt)}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </FadeInSection>
    </div>
  );
}
