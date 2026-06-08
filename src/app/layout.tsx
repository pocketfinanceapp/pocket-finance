import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pocket Finance — Finance news, built for the way you scroll",
  description:
    "Swipe through breaking market headlines, read full articles, and check stock intelligence — all in seconds.",
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
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/pocket-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/pocket-logo.png" />
      </head>
      <body className="min-h-screen bg-pocket-bg antialiased">{children}</body>
    </html>
  );
}
