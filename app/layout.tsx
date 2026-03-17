import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Interest Form",
  description: "A simple landing page to collect interest for a startup compliance product.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        <footer className="w-full mt-12 border-t border-gray-200 dark:border-gray-800 py-6 flex items-center justify-center gap-3">
          <div className="text-center">
            <div className="text-base md:text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">First Check</div>
          </div>
          <footer className="py-12 border-t border-white/5 text-center text-gray-200 text-[14px] uppercase tracking-[0.4em] font-black">
           © 2026 • The Pre-Launch Standard
          </footer>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}
