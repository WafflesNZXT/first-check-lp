import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { HashScrollHandler } from '@/components/HashScrollHandler';


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
        <HashScrollHandler />
        <footer className="w-full border-t border-white/5 bg-[#0a0a0a] mt-12">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

              {/* Brand column */}
              <div className="md:col-span-2 space-y-4">
                <div className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
                  First Check
                </div>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                  A manual, ruthless audit of your startup's site. Delivered in 24 hours by a real founder, not a bot.
                </p>
                <p className="text-gray-700 text-xs font-bold uppercase tracking-widest">
                  By Wafi Syed
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <p className="text-white font-black text-xs uppercase tracking-widest">Product</p>
                <ul className="space-y-3">
                  {[
                    { label: "How it Works", href: "/#how-it-works" },
                    { label: "Pricing", href: "/pricing" },
                    { label: "Comparison", href: "/#comparison" },
                    { label: "Get Audit", href: "/pricing#get-audit" },
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-gray-500 text-sm hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal / Contact */}
              <div className="space-y-4">
                <p className="text-white font-black text-xs uppercase tracking-widest">Company</p>
                <ul className="space-y-3">
                  {[
                    { label: "Contact", href: "mailto:hello@firstcheck.dev" },
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-gray-500 text-sm hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-700 text-xs uppercase tracking-widest font-black">
                © 2026 First Check · The Pre-Launch Standard
              </p>
              <p className="text-gray-700 text-xs">
                Built by a founder, for founders.
              </p>
            </div>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  );
}