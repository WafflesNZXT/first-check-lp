"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';

type NavProps = {
  useHomeStyleTop?: boolean;
};

export default function Nav({ useHomeStyleTop = false }: NavProps) {
  const [open, setOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isHeroTop = (isHome || useHomeStyleTop) && !hasScrolled;

  useEffect(() => {
    const updateScrollState = () => {
      setHasScrolled(window.scrollY > 24);
    };

    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrollState);
    };
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    const syncAuthState = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setIsAuthenticated(Boolean(data.session?.user));
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
        }
      }
    };

    syncAuthState();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  function smoothScrollTo(elId: string) {
    const el = document.getElementById(elId.replace('#', ''));
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--announcement-offset') || '0', 10) || 0;
    const targetY = window.scrollY + rect.top - 24 - offset;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  function handleSectionClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: '#how-it-works' | '#comparison',
    closeMenu = false
  ) {
    if (closeMenu) setOpen(false);
    if (!isHome) return;
    e.preventDefault();
    smoothScrollTo(sectionId);
  }

  return (
    <>
      <nav
        className={`max-w-7xl mx-auto px-6 sticky top-0 md:top-[var(--announcement-offset,0px)] z-40 font-sans transition-all duration-500 ${
          isHeroTop ? 'pt-5 md:pt-7' : 'pt-2 md:pt-4'
        }`}
      >
        <div
          className={`rounded-[2rem] transition-all duration-500 ${
            isHeroTop
              ? 'border border-transparent bg-transparent backdrop-blur-0 shadow-none px-2 md:px-4 py-4 md:py-5'
              : 'border border-white/45 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.12)] px-5 md:px-8 py-3.5'
          }`}
        >
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center min-w-0">
              <Link href="/" aria-label="Home" className="text-black dark:text-white transition-colors">
                <Logo size={48} className="text-black dark:text-white" />
              </Link>
            </div>

            <div className="hidden lg:flex items-center justify-center gap-10 text-lg font-semibold text-black/55 dark:text-slate-300">
              <Link href="/pricing" className="hover:text-black dark:hover:text-white transition-colors">Pricing</Link>
              <Link href="/#how-it-works" onClick={(e) => handleSectionClick(e, '#how-it-works')} className="hover:text-black dark:hover:text-white transition-colors">How it Works</Link>
              <Link href="/#comparison" onClick={(e) => handleSectionClick(e, '#comparison')} className="hover:text-black dark:hover:text-white transition-colors">Comparison</Link>
              <Link href="/case-studies" className="hover:text-black dark:hover:text-white transition-colors">Case Studies</Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-full text-sm font-bold transition-colors shadow-[0_8px_24px_rgba(37,99,235,0.35)]">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/signin" className="border border-black/15 dark:border-slate-600 hover:border-black/30 dark:hover:border-slate-400 text-black dark:text-slate-100 px-6 py-3 rounded-full text-sm font-semibold transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup" className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3 rounded-full text-sm font-bold transition-colors shadow-[0_8px_24px_rgba(37,99,235,0.35)]">
                    Get Started ↗
                  </Link>
                </>
              )}
            </div>

            <div className="md:hidden relative z-30">
              <button
                aria-label={open ? 'Close menu' : 'Open menu'}
                className={`p-2 rounded-md border transition-all ${
                  isHeroTop
                    ? 'bg-transparent border-transparent text-black dark:text-slate-100 hover:bg-white/10'
                    : 'bg-white/60 dark:bg-slate-900/70 border-white/60 dark:border-slate-700 text-black dark:text-slate-100 backdrop-blur-md hover:bg-white/80 dark:hover:bg-slate-800'
                }`}
                onClick={() => setOpen(s => !s)}
              >
                {open ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`md:hidden fixed left-0 right-0 z-50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ top: 'var(--announcement-offset, 0px)', height: 'calc(100% - var(--announcement-offset, 0px))' }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

        <div className={`absolute top-0 right-0 h-full w-3/4 max-w-xs shadow-xl transform transition-transform duration-300 bg-white dark:bg-slate-900 border-l border-black/10 dark:border-slate-700 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="px-6 pt-6">
            <div className="flex items-center justify-end">
              <button aria-label="Close menu" className="p-2 text-black dark:text-slate-100" onClick={() => setOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-4 px-1">
              <Link href="/" onClick={() => setOpen(false)} className="text-black dark:text-slate-100 text-lg">Home</Link>
              <Link href="/#how-it-works" onClick={(e) => handleSectionClick(e, '#how-it-works', true)} className="text-black dark:text-slate-100 text-lg">How it Works</Link>
              <Link href="/#comparison" onClick={(e) => handleSectionClick(e, '#comparison', true)} className="text-black dark:text-slate-100 text-lg">Comparison</Link>
              <Link href="/pricing" onClick={() => setOpen(false)} className="text-black dark:text-slate-100 text-lg">Pricing</Link>
              <Link href="/case-studies" onClick={() => setOpen(false)} className="text-black dark:text-slate-100 text-lg">Case Studies</Link>
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition-colors">Dashboard</Link>
              ) : (
                <>
                  <Link href="/signin" onClick={() => setOpen(false)} className="mt-4 inline-block px-4 py-2 border border-black/15 dark:border-slate-600 text-black dark:text-slate-100 rounded-md font-semibold transition-colors">Log in</Link>
                  <Link href="/signup" onClick={() => setOpen(false)} className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition-colors">Get Started</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
