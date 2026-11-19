"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';

type NavProps = {
  useHomeStyleTop?: boolean;
};

export default function Nav({ useHomeStyleTop = false }: NavProps) {
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isHeroTop = (isHome || useHomeStyleTop) && !hasScrolled;

  useEffect(() => {
    const updateScrollState = () => {
      setHasScrolled(previous => previous ? window.scrollY > 4 : window.scrollY > 24);
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

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 64rem)');
    const closeOnDesktop = () => {
      if (desktop.matches) menuRef.current?.close();
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  function openMenu() {
    menuRef.current?.showModal();
    setOpen(true);
  }

  function closeMenu() {
    menuRef.current?.close();
  }

  function smoothScrollTo(elId: string) {
    const el = document.getElementById(elId.replace('#', ''));
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
    const targetY = window.scrollY + rect.top - navBottom - 16;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: targetY, behavior: reducedMotion ? 'instant' : 'smooth' });
  }

  function handleSectionClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: '#how-it-works' | '#comparison',
    fromMobileMenu = false
  ) {
    if (fromMobileMenu) closeMenu();
    if (!isHome) return;
    e.preventDefault();
    smoothScrollTo(sectionId);
  }

  return (
    <>
      <nav
        ref={navRef}
        className="max-w-7xl mx-auto px-6 sticky top-0 md:top-[var(--announcement-offset,0px)] z-40 font-sans pt-3 md:pt-4"
      >
        <div
          className={`origin-top rounded-[2rem] transition-[margin,padding,background-color,border-color,box-shadow,backdrop-filter] duration-500 ${
            isHeroTop
              ? 'mx-0 border border-transparent bg-transparent backdrop-blur-0 shadow-none px-2 md:px-4 py-3.5'
              : 'mx-2 md:mx-4 border border-white/45 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.12)] px-5 md:px-8 py-3.5'
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

            <div className="hidden lg:flex items-center gap-3">
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
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <div className="lg:hidden relative z-30">
              <button
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-controls="mobile-navigation"
                className={`p-2 rounded-md border transition-all ${
                  isHeroTop
                    ? 'bg-transparent border-transparent text-black dark:text-slate-100 hover:bg-white/10'
                    : 'bg-white/60 dark:bg-slate-900/70 border-white/60 dark:border-slate-700 text-black dark:text-slate-100 backdrop-blur-md hover:bg-white/80 dark:hover:bg-slate-800'
                }`}
                onClick={openMenu}
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
      <dialog
        ref={menuRef}
        id="mobile-navigation"
        aria-label="Navigation menu"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-3/4 max-w-xs overflow-y-auto border-l border-black/10 bg-white shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900"
      >
          <div className="px-6 pt-6">
            <div className="flex items-center justify-end">
              <button aria-label="Close menu" className="p-2 text-black dark:text-slate-100" onClick={closeMenu}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            <nav className="mt-6 flex flex-col gap-4 px-1">
              <Link href="/" onClick={closeMenu} className="text-black dark:text-slate-100 text-lg">Home</Link>
              <Link href="/#how-it-works" onClick={(e) => handleSectionClick(e, '#how-it-works', true)} className="text-black dark:text-slate-100 text-lg">How it Works</Link>
              <Link href="/#comparison" onClick={(e) => handleSectionClick(e, '#comparison', true)} className="text-black dark:text-slate-100 text-lg">Comparison</Link>
              <Link href="/pricing" onClick={closeMenu} className="text-black dark:text-slate-100 text-lg">Pricing</Link>
              <Link href="/case-studies" onClick={closeMenu} className="text-black dark:text-slate-100 text-lg">Case Studies</Link>
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={closeMenu} className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition-colors">Dashboard</Link>
              ) : (
                <>
                  <Link href="/signin" onClick={closeMenu} className="mt-4 inline-block px-4 py-2 border border-black/15 dark:border-slate-600 text-black dark:text-slate-100 rounded-md font-semibold transition-colors">Log in</Link>
                  <Link href="/signup" onClick={closeMenu} className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-bold transition-colors">Get Started</Link>
                </>
              )}
            </nav>
          </div>
      </dialog>
    </>
  );
}
