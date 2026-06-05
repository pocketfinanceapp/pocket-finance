import { AppGate } from "@/components/AppGate";
import { AppProviders } from "@/components/AppProviders";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-[100dvh] bg-black">
      <AppProviders>
        <AppGate>{children}</AppGate>
      </AppProviders>
    </main>
  );
}
