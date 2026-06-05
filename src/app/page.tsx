import { AppShell } from "@/components/AppShell";
import { AppProvider } from "@/context/AppContext";
import { fetchNewsArticles } from "@/lib/fetchNews";

export default async function Home() {
  const articles = await fetchNewsArticles();

  return (
    <main className="min-h-[100dvh] bg-black">
      <AppProvider>
        <AppShell initialArticles={articles} />
      </AppProvider>
    </main>
  );
}
