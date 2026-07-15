"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { NewsArticle } from "@/lib/types";
import { formatDate, readTime } from "@/lib/utils";
import { getArticleSubheading } from "@/lib/articlePreview";
import { ArticleAISummary } from "./ArticleAISummary";
import { FeedCardFallbackBackground } from "./FeedCardFallbackBackground";
import { FadeInSection } from "./SubPageShell";
import { MarketBadge } from "./MarketBadge";
import { SourceBadge } from "./SourceBadge";

interface ArticlePanelProps {
  article: NewsArticle;
  onBack: () => void;
}

function ArticleHeroImage({ article }: { article: NewsArticle }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [article.imageUrl, article.id]);

  const showFallback = !article.imageUrl || imageFailed;

  return (
    <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#0a0a0a]">
      {showFallback ? (
        <FeedCardFallbackBackground article={article} />
      ) : (
        <Image
          src={article.imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 430px) 100vw"
          unoptimized
          onError={() => setImageFailed(true)}
        />
      )}
    </div>
  );
}

export function ArticlePanel({ article, onBack }: ArticlePanelProps) {
  const { saveArticle, unsaveArticle, isArticleSaved } = useApp();
  const saved = isArticleSaved(article.id);
  const displaySubheading = getArticleSubheading(article.subheading);
  const scrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [article.id]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const toggleSave = async () => {
    if (saved) {
      await unsaveArticle(article.id);
    } else {
      await saveArticle(article);
    }
  };

  return (
    <div className="pf-page relative flex h-full flex-col bg-pocket-bg text-pocket-text">
      <FadeInSection key={article.id} className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
        <button
          type="button"
          data-no-drag
          onPointerDown={stop}
          onClick={() => void toggleSave()}
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-[var(--pocket-surface-hover)]"
          aria-label={saved ? "Remove from Saved" : "Save article"}
          style={{ touchAction: "manipulation" }}
        >
          <Bookmark
            className={`h-5 w-5 ${
              saved ? "fill-pocket-teal text-pocket-teal" : "text-pocket-text"
            }`}
          />
        </button>
      </header>

      <article
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <MarketBadge market={article.market} />
          <span className="rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-2.5 py-1 text-[11px] font-bold text-[#00C6C6]">
            {article.ticker}
          </span>
          <span className="text-[12px] text-pocket-muted">{article.companyName}</span>
        </div>

        <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.2] tracking-tight text-pocket-text">
          {article.headline}
        </h1>

        {displaySubheading ? (
          <p className="mt-2 text-[15px] leading-snug text-pocket-muted">
            {displaySubheading}
          </p>
        ) : null}

        <div className="mt-2 opacity-80">
          <SourceBadge
            sourceName={article.sourceName}
            sourceId={article.sourceId}
            sourceUrl={article.sourceUrl}
            publishedAt={article.publishedAt}
            timeLabel={`${formatDate(article.publishedAt)} · ${readTime(article.body)}`}
            size="sm"
          />
        </div>

        <ArticleHeroImage article={article} />

        {article.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card)] px-3.5 py-1.5 text-sm font-medium text-pocket-text"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <ArticleAISummary article={article} />

        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-no-drag
          className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-4 py-3 text-center text-[15px] font-bold text-white shadow-[0_6px_24px_rgba(59,110,245,0.22)] transition-transform active:scale-[0.98]"
          style={{ touchAction: "manipulation" }}
        >
          Read full article →
        </a>
      </article>
      </FadeInSection>
    </div>
  );
}
