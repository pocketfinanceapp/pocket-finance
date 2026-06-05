import { Suspense } from "react";
import { AppGate } from "@/components/AppGate";
import { AppBootSplash } from "@/components/AppBootSplash";
import { AppProviders } from "@/components/AppProviders";
import { TabAppShell } from "@/components/TabAppShell";
import { fetchNewsArticles } from "@/lib/fetchNews";

export default async function AppLayout({
  children: _children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const articles = await fetchNewsArticles();

  return (
    <main className="min-h-[100dvh] bg-black">
      <AppProviders>
        <AppGate>
          <Suspense fallback={<AppBootSplash />}>
            <TabAppShell initialArticles={articles} />
          </Suspense>
        </AppGate>
      </AppProviders>
    </main>
  );
}
