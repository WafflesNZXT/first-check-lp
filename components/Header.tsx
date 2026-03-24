"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
// text-only branding — logo removed per request

export const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

  const links = [
    { label: "Home", href: "/" },
    { label: "Pricing", href: "/pricing" },
    { label: "How it Works", href: "/#how-it-works" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Get Audit", href: "/pricing#get-audit" },
  ];

  return (
    <header className="w-full bg-transparent sticky z-40" style={{ top: 'var(--announcement-offset, 0px)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-white font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500 sm:-mt-1 md:mt-0">
            First Check
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            l.label === 'Get Audit' ? (
              <a key={l.href} href={l.href} className="ml-4 px-4 py-2 bg-white text-[#0a0a0a] rounded-md font-bold shadow-sm hover:shadow-md transition">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="text-gray-400 hover:text-white transition-colors">
                {l.label}
              </Link>
            )
          ))}
          <a href="mailto:wafi.syed5@gmail.com" className="ml-4 px-4 py-2 bg-white/5 text-white rounded-md hover:bg-white/10 transition">
            Contact
          </a>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            className="p-2 rounded-md text-white/90 hover:bg-white/5"
            onClick={() => setOpen((s) => !s)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed left-0 right-0 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: 'var(--announcement-offset, 0px)', height: 'calc(100% - var(--announcement-offset, 0px))' }}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

        <div className={`absolute top-0 right-0 h-full w-3/4 max-w-xs bg-[#0a0a0a] shadow-xl transform transition-transform duration-300 z-60 ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="px-6 pt-8 pb-6">
            <div className="flex items-center justify-between">
              <div />
              <button aria-label="Close menu" className="p-2 text-white" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-4">
              {links.map((l) => (
                l.label === 'Get Audit' ? (
                  <a key={l.href} href={l.href} className="text-white text-lg font-bold bg-white/5 px-3 py-2 rounded" onClick={() => setOpen(false)}>
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.href} href={l.href} className="text-white text-lg" onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                )
              ))}

              {/* <a href="mailto:wafi.syed5@gmail.com" className="mt-4 inline-block px-4 py-2 bg-white/5 text-white rounded-md" onClick={() => setOpen(false)}>
                Contact
              </a> */}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
