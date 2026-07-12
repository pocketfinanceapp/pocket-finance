import { Suspense } from "react";
import { AppBodyLock } from "@/components/AppBodyLock";
import { AppGate } from "@/components/AppGate";
import { AppBootSplash } from "@/components/AppBootSplash";
import { AppProviders } from "@/components/AppProviders";
import { TabAppShell } from "@/components/TabAppShell";
import { fetchNewsArticles, fetchTrendingNewsArticles } from "@/lib/fetchNews";

export default async function AppLayout({
  children: _children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [articles, trendingArticles] = await Promise.all([
    fetchNewsArticles(),
    fetchTrendingNewsArticles(),
  ]);

  return (
    <main className="app-shell-height bg-pocket-bg">
      <AppBodyLock />
      <AppProviders>
        <AppGate>
          <Suspense fallback={<AppBootSplash />}>
            <TabAppShell
              initialArticles={articles}
              initialTrendingArticles={trendingArticles}
            />
          </Suspense>
        </AppGate>
      </AppProviders>
    </main>
  );
}
