"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronDown, MessageCircle, Plus, Send } from "lucide-react";
import { FireSparkIcon } from "@/components/icons/FireSparkIcon";
import { tabEnterStyle, useTabPageEntered } from "@/lib/tabEnterAnimation";

type ForumPost = {
  id: string;
  author: string;
  role: string;
  title: string;
  body: string;
  tags: string[];
  likes: number;
  replies: number;
  minutesAgo: number;
  imageUrl?: string;
};

type ForumFilter = "recent" | "trending" | "rising" | "popular";

const INITIAL_POSTS: ForumPost[] = [
  {
    id: "1",
    author: "Alex Tan",
    role: "Long-term investor",
    title: "Taiwan semis outlook after this quarter?",
    body: "Seeing strong demand tailwinds again. Curious how everyone is positioning for the next 6-12 months.",
    tags: ["Taiwan", "Semiconductors"],
    likes: 24,
    replies: 13,
    minutesAgo: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=900&q=80",
  },
  {
    id: "2",
    author: "Maya Lee",
    role: "Macro watcher",
    title: "Rate cut odds vs market pricing",
    body: "Bond market is leaning one way, equities another. Are you adjusting risk or waiting for confirmation?",
    tags: ["Macro", "Rates"],
    likes: 17,
    replies: 9,
    minutesAgo: 47,
    imageUrl:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=900&q=80",
  },
  {
    id: "3",
    author: "Jordan Chua",
    role: "Swing trader",
    title: "Watchlist setup before earnings week",
    body: "I trimmed broad exposure and built a focused list around quality names. Happy to share my filters.",
    tags: ["Watchlist", "Earnings"],
    likes: 31,
    replies: 22,
    minutesAgo: 95,
    imageUrl:
      "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=900&q=80",
  },
];

export function ForumPage() {
  const tabEntered = useTabPageEntered("forum");
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [filter, setFilter] = useState<ForumFilter>("trending");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const trendingTags = useMemo(() => {
    const counter = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        counter.set(tag, (counter.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const byTag = activeTag
      ? posts.filter((p) =>
          p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())
        )
      : posts;

    const freshness = (minutesAgo: number) => Math.max(0, 140 - minutesAgo) / 140;
    const popularity = (post: ForumPost) => post.likes * 1.2 + post.replies * 1.5;
    const jitter = (id: string) =>
      ((id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 17) - 8) / 10;

    return [...byTag].sort((a, b) => {
      const score = (post: ForumPost) => {
        if (filter === "recent") return -post.minutesAgo + jitter(post.id);
        if (filter === "popular") return popularity(post);
        if (filter === "rising") {
          return (
            (post.replies * 1.6 + post.likes * 0.8) *
            (0.5 + freshness(post.minutesAgo))
          );
        }
        return popularity(post) * 0.65 + freshness(post.minutesAgo) * 26 + jitter(post.id);
      };
      return score(b) - score(a);
    });
  }, [posts, activeTag, filter]);

  const popularIds = useMemo(() => {
    return [...posts]
      .sort((a, b) => b.likes + b.replies * 1.5 - (a.likes + a.replies * 1.5))
      .slice(0, 2)
      .map((p) => p.id);
  }, [posts]);

  const canPost = title.trim().length >= 8 && body.trim().length >= 20;

  const publishPost = () => {
    if (!canPost) return;
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);

    setPosts((prev) => [
      {
        id: String(Date.now()),
        author: "You",
        role: "Community member",
        title: title.trim(),
        body: body.trim(),
        tags: tags.length > 0 ? tags : ["Discussion"],
        likes: 0,
        replies: 0,
        minutesAgo: 0,
        imageUrl: imageDataUrl ?? undefined,
      },
      ...prev,
    ]);
    setTitle("");
    setBody("");
    setTagInput("");
    setImageDataUrl(null);
    setComposerOpen(false);
  };

  const handleAttachImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const bumpPostStat = (postId: string, field: "likes" | "replies") => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, [field]: p[field] + 1 } : p))
    );
  };

  return (
    <div className="pf-page flex h-full min-h-0 flex-col bg-pocket-bg text-pocket-text">
      <header
        className="shrink-0 px-5 pb-3"
        style={{
          paddingTop: "max(12px, env(safe-area-inset-top))",
          ...tabEnterStyle(tabEntered, 0),
        }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-pocket-text">Forum</h1>
            <p className="mt-0.5 text-[13px] text-pocket-muted">
              Discuss markets with the Pocket Finance community
            </p>
          </div>
          <button
            type="button"
            data-no-drag
            onClick={() => setComposerOpen(true)}
            className="whitespace-nowrap flex items-center gap-1.5 rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-card-solid)] px-3.5 py-2 text-[12px] font-semibold text-pocket-text transition-all hover:translate-y-[-1px] active:translate-y-[0]"
          >
            <Plus className="h-3.5 w-3.5" />
            New Post
          </button>
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(9rem+env(safe-area-inset-bottom))]"
        style={tabEnterStyle(tabEntered, 80)}
      >
        <section className="pf-card-surface mt-2 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#00C6C6]" />
              <p className="text-[12px] font-semibold uppercase tracking-wide text-pocket-muted">
                Trending Topics
              </p>
            </div>
            <label className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as ForumFilter)}
                className="appearance-none rounded-full border border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-1.5 pr-7 text-[12px] font-medium text-pocket-text outline-none"
              >
                <option value="recent">Recent</option>
                <option value="trending">Trending</option>
                <option value="rising">Rising</option>
                <option value="popular">Popular</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-pocket-muted" />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <button
                key={tag}
                type="button"
                data-no-drag
                onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors active:opacity-80 ${
                  activeTag === tag
                    ? "border-[#00C6C6]/40 bg-[#00C6C6]/10 text-[#00C6C6]"
                    : "border-[var(--pocket-border)] bg-[var(--pocket-bg)] text-pocket-muted hover:text-pocket-text"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 space-y-3">
          {visiblePosts.map((post, i) => (
            <article
              key={post.id}
              className="pf-card-surface rounded-2xl p-4"
              style={tabEnterStyle(tabEntered, 120 + i * 70)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-pocket-text">{post.author}</p>
                  <p className="text-[11px] text-pocket-muted">
                    {post.role} ·{" "}
                    {post.minutesAgo < 60
                      ? `${post.minutesAgo}m`
                      : `${Math.floor(post.minutesAgo / 60)}h`}{" "}
                    ago
                  </p>
                </div>
                {popularIds.includes(post.id) && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-orange-500/12 px-2 py-1">
                    <FireSparkIcon className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-semibold text-orange-400">
                      Popular
                    </span>
                  </div>
                )}
              </div>

              <h3 className="mt-3 text-[16px] font-semibold leading-snug text-pocket-text">
                {post.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-pocket-muted">{post.body}</p>

              {post.imageUrl && (
                <button
                  type="button"
                  data-no-drag
                  onClick={() => setOpenPostId(post.id)}
                  className="mt-3 block h-36 w-full overflow-hidden rounded-xl border border-[var(--pocket-border)]"
                >
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    width={720}
                    height={360}
                    className="h-full w-full object-cover"
                  />
                </button>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={`${post.id}-${tag}`}
                    className="rounded-full bg-[var(--pocket-bg)] px-2.5 py-1 text-[11px] text-pocket-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-4 text-[12px] text-pocket-muted">
                <button
                  type="button"
                  data-no-drag
                  onClick={() => bumpPostStat(post.id, "likes")}
                  className="transition-colors hover:text-pocket-text"
                >
                  {post.likes} likes
                </button>
                <button
                  type="button"
                  data-no-drag
                  onClick={() => bumpPostStat(post.id, "replies")}
                  className="transition-colors hover:text-pocket-text"
                >
                  {post.replies} replies
                </button>
                <button
                  type="button"
                  data-no-drag
                  onClick={() => {
                    setComposerOpen(true);
                    setTitle(`Reply: ${post.title}`.slice(0, 120));
                  }}
                  className="transition-colors hover:text-pocket-text"
                >
                  Join discussion
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>

      {composerOpen && (
        <div className="absolute inset-0 z-20 flex items-end bg-black/35 p-3 backdrop-blur-sm">
          <div
            className="pf-card-surface w-full rounded-2xl border border-[var(--pocket-border)] p-4"
            style={tabEnterStyle(composerOpen, 0)}
          >
            <p className="text-[16px] font-semibold text-pocket-text">Create post</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              className="mt-3 w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-2.5 text-[13px] text-pocket-text outline-none focus:border-[#00C6C6]"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What do you want to discuss?"
              rows={4}
              className="mt-2.5 w-full resize-none rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-2.5 text-[13px] text-pocket-text outline-none focus:border-[#00C6C6]"
            />
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tags (comma separated)"
              className="mt-2.5 w-full rounded-xl border border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-2.5 text-[13px] text-pocket-text outline-none focus:border-[#00C6C6]"
            />
            <label className="mt-2.5 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--pocket-border)] bg-[var(--pocket-bg)] px-3 py-2 text-[12px] font-medium text-pocket-muted hover:text-pocket-text">
              {imageDataUrl ? "Image attached" : "Attach image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAttachImage(e.target.files?.[0] ?? null)}
              />
            </label>
            {imageDataUrl && (
              <div className="mt-2 h-28 w-full overflow-hidden rounded-xl border border-[var(--pocket-border)]">
                <Image
                  src={imageDataUrl}
                  alt="Attached preview"
                  width={720}
                  height={360}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                type="button"
                data-no-drag
                onClick={() => setComposerOpen(false)}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-pocket-muted transition-colors hover:text-pocket-text"
              >
                Cancel
              </button>
              <button
                type="button"
                data-no-drag
                onClick={publishPost}
                disabled={!canPost}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#3B6EF5] to-[#00C6C6] px-4 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Send className="h-3.5 w-3.5" />
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {openPostId && (
        <button
          type="button"
          data-no-drag
          className="absolute inset-0 z-30 bg-black/70 p-4"
          onClick={() => setOpenPostId(null)}
        >
          <div className="mx-auto mt-12 max-w-mobile overflow-hidden rounded-2xl border border-white/20">
            <Image
              src={posts.find((p) => p.id === openPostId)?.imageUrl ?? ""}
              alt="Forum post image"
              width={900}
              height={900}
              className="h-auto w-full object-cover"
            />
          </div>
        </button>
      )}
    </div>
  );
}
