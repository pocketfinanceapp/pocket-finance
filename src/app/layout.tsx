import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ThemeInitScript } from "@/components/ThemeInitScript";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = "https://www.pocketfinance.app";
const SITE_TITLE = "Pocket Finance — Finance news, built for the way you scroll";
const SITE_DESCRIPTION =
  "Swipe through breaking market headlines, read full articles, and check stock intelligence — all in seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  // Without these, sharing the link on X/Reddit/Slack/iMessage/Product Hunt
  // etc. renders a blank/broken link preview instead of a card — this is
  // the metadata that actually gets read for that, separate from the plain
  // <title>/<meta description> above.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Pocket Finance",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/logo.png?v=2",
        width: 1024,
        height: 1024,
        alt: "Pocket Finance",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logo.png?v=2"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pocket Finance",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeInitScript />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png?v=2" />
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "x5qkiiv02t");
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-pocket-bg text-pocket-text antialiased">{children}</body>
    </html>
  );
}
