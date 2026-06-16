"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { hasUsableFeedImage } from "@/lib/feedImage";
import type { NewsArticle } from "@/lib/types";
import { formatDate, readTime } from "@/lib/utils";
import { getArticleSubheading } from "@/lib/articlePreview";
import { ArticleAISummary } from "./ArticleAISummary";
import { FeedCardFallbackBackground } from "./FeedCardFallbackBackground";
import { MarketBadge } from "./MarketBadge";
import { SourceBadge } from "./SourceBadge";

function articleSnippet(article: NewsArticle): string {
  const subheading = article.subheading?.trim();
  if (subheading) return subheading;
  const first = article.body.split(/\n\n+/).map((p) => p.trim()).find(Boolean);
  return first?.slice(0, 400) ?? "";
}

interface ArticlePanelProps {
  article: NewsArticle;
  onBack: () => void;
}

function ArticleHeroImage({ article }: { article: NewsArticle }) {
  const usableInitial = hasUsableFeedImage(article.imageUrl);
  const [showImage, setShowImage] = useState(usableInitial);
  const [imgSrc, setImgSrc] = useState(usableInitial ? article.imageUrl : "");

  useEffect(() => {
    const usable = hasUsableFeedImage(article.imageUrl);
    setShowImage(usable);
    setImgSrc(usable ? article.imageUrl : "");
  }, [article.id, article.imageUrl]);

  return (
    <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#0a0a0a]">
      {showImage && imgSrc ? (
        <Image
          src={imgSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 430px) 100vw"
          unoptimized
          onError={() => {
            setShowImage(false);
            setImgSrc("");
          }}
        />
      ) : (
        <FeedCardFallbackBackground article={article} />
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
    <div className="relative flex h-full flex-col bg-black text-white">
      <header className="flex shrink-0 items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          data-no-drag
          onPointerDown={stop}
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
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
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
          aria-label={saved ? "Remove bookmark" : "Save article"}
          style={{ touchAction: "manipulation" }}
        >
          <Bookmark
            className={`h-5 w-5 ${saved ? "fill-white text-white" : ""}`}
          />
        </button>
      </header>

      <article
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]"
      >
        <MarketBadge market={article.market} />

        <h1 className="mt-2 text-[1.75rem] font-bold leading-[1.2] tracking-tight">
          {article.headline}
        </h1>

        {displaySubheading ? (
          <p className="mt-2 text-[15px] leading-snug text-zinc-400">
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
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-sm font-medium text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <ArticleAISummary
          articleId={article.id}
          headline={article.headline}
          snippet={articleSnippet(article)}
        />

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
    </div>
  );
}
