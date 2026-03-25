"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Nav() {
  const [open, setOpen] = useState(false);

  function smoothScrollTo(elId: string) {
    const el = document.getElementById(elId.replace('#', ''));
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--announcement-offset') || '0', 10) || 0;
    const targetY = window.scrollY + rect.top - 24 - offset;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 relative z-20 font-sans">
        <div className="flex items-center">
          <Link href="/" aria-label="Home" className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
            First Check
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); smoothScrollTo('#how-it-works'); }} className="hover:text-white transition-colors">How it Works</a>
          <a href="#comparison" onClick={(e) => { e.preventDefault(); smoothScrollTo('#comparison'); }} className="hover:text-white transition-colors">Comparison</a>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link>
          <Link href="/pricing" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/10">Get Audit</Link>
        </div>

        {/* Mobile toggle (fixed so it remains visible while scrolling) */}
        <div
          className="md:hidden fixed right-4 z-60 transition-all"
          style={{ top: scrolled ? 'calc(var(--announcement-offset, 0px) + 8px)' : '101px' }}
        >
          <button aria-label={open ? 'Close menu' : 'Open menu'} className="p-2 rounded-md text-white/90 hover:bg-white/5 bg-transparent" onClick={() => setOpen(s => !s)}>
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`md:hidden fixed left-0 right-0 z-50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ top: 'var(--announcement-offset, 0px)', height: 'calc(100% - var(--announcement-offset, 0px))' }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

        <div className={`absolute top-0 right-0 h-full w-3/4 max-w-xs bg-[#0a0a0a] shadow-xl transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="px-6 pt-6">
            <div className="flex items-center justify-end">
              <button aria-label="Close menu" className="p-2 text-white" onClick={() => setOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-4 px-1">
              <Link href="/" onClick={() => setOpen(false)} className="text-white text-lg">Home</Link>
              <a href="#how-it-works" onClick={(e) => { e.preventDefault(); setOpen(false); smoothScrollTo('#how-it-works'); }} className="text-white text-lg">How it Works</a>
              <a href="#comparison" onClick={(e) => { e.preventDefault(); setOpen(false); smoothScrollTo('#comparison'); }} className="text-white text-lg">Comparison</a>
              <Link href="/pricing" onClick={() => setOpen(false)} className="text-white text-lg">Pricing</Link>
              <Link href="/case-studies" onClick={() => setOpen(false)} className="text-white text-lg">Case Studies</Link>
              <Link href="/pricing" onClick={() => setOpen(false)} className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md">Get Audit</Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
