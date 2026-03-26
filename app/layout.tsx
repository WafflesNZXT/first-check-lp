import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { HashScrollHandler } from '@/components/HashScrollHandler';
import { AnnouncementBar } from './AnnouncementBar';
import SiteFooter from '@/components/SiteFooter';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "audo",
  description: "Dashboard-first website auditing for startup teams. Run audits, prioritize fixes, and track progress in one place.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/ai-favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon"],
  },
  // `themeColor` is handled manually in the head to avoid Next.js metadata warnings
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#111111" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnnouncementBar />
        {children}
        <HashScrollHandler />
        <SiteFooter />

        <Analytics />
      </body>
    </html>
  );
}