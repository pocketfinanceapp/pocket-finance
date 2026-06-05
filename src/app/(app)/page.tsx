import { Suspense } from "react";
import { AppBootSplash } from "@/components/AppBootSplash";
import { FeedErrorBoundary } from "@/components/FeedErrorBoundary";
import { NewsFeed } from "@/components/NewsFeed";
import { fetchNewsArticles } from "@/lib/fetchNews";

export default async function HomePage() {
  const articles = await fetchNewsArticles();

  return (
    <FeedErrorBoundary>
      <Suspense fallback={<AppBootSplash />}>
        <NewsFeed initialArticles={articles} />
      </Suspense>
    </FeedErrorBoundary>
  );
}
