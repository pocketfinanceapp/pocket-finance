"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, Bookmark, MoreHorizontal } from "lucide-react";
import type { NewsArticle } from "@/lib/types";
import { formatDate, readTime } from "@/lib/utils";
import { MarketBadge } from "./MarketBadge";
import { PocketPublisherBadge } from "./PocketLogo";

interface ArticlePanelProps {
  article: NewsArticle;
  onBack: () => void;
}

export function ArticlePanel({ article, onBack }: ArticlePanelProps) {
  const paragraphs = article.body.split(/\n\n+/).filter(Boolean);
  const [saved, setSaved] = useState(false);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className="flex h-full flex-col bg-pocket-bg text-white">
      <header className="flex shrink-0 items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
        <div className="flex gap-2">
          <button
            type="button"
            data-no-drag
            onPointerDown={stop}
            onClick={() => setSaved((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
            aria-label={saved ? "Remove bookmark" : "Save article"}
            style={{ touchAction: "manipulation" }}
          >
            <Bookmark
              className={`h-5 w-5 ${saved ? "fill-white text-white" : ""}`}
            />
          </button>
          <button
            type="button"
            data-no-drag
            onPointerDown={stop}
            onClick={() => {}}
            className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Menu"
            style={{ touchAction: "manipulation" }}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      <article className="flex-1 overflow-y-auto px-4 pb-28">
        <MarketBadge market={article.market} />
        <h1 className="mt-3 text-2xl font-bold leading-tight">
          {article.headline}
        </h1>

        <div className="mt-4">
          <PocketPublisherBadge
            compact
            timeLabel={`${formatDate(article.publishedAt)} · ${readTime(article.body)}`}
          />
        </div>

        <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-2xl">
          <Image
            src={article.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 430px) 100vw"
            unoptimized
          />
        </div>

        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-zinc-200">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-pocket-border bg-pocket-surface px-4 py-2 text-sm font-medium text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
