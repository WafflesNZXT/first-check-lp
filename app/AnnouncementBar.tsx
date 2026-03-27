"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

// Set your sale end date here — 7 days from now is a good start
const SALE_END = new Date('2026-04-01T23:59:59');

function getTimeLeft() {
  const now = new Date();
  const diff = SALE_END.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="bg-black/20 text-white font-black text-xs px-1.5 py-0.5 rounded-md min-w-[24px] text-center tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function AnnouncementBar() {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // publish the announcement height so other UI (header/overlays) can offset themselves
  useEffect(() => {
    function updateOffset() {
      if (ref.current) {
        const h = ref.current.offsetHeight;
        document.documentElement.style.setProperty('--announcement-offset', `${h}px`);
      }
    }

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => {
      window.removeEventListener('resize', updateOffset);
      document.documentElement.style.setProperty('--announcement-offset', `0px`);
    };
  }, []);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('announcement-dismissed');
    if (wasDismissed) setDismissed(true);

    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (dismissed || !timeLeft) return null;

  return (
    <div ref={ref} className="announcement-bar print-hide w-full bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 relative z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">

        {/* Left spacer for centering */}
        <div className="w-6 hidden md:block" />

        {/* Center content */}
        <div className="flex items-center gap-3 flex-wrap justify-center text-center">
          <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
            Spring Sale
          </span>
          <span className="text-white text-sm font-bold">
            Discounted pricing ends in
          </span>

          {/* Timer */}
          <div className="flex items-center gap-2">
            {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} label="d" />}
            <TimeUnit value={timeLeft.hours} label="h" />
            <TimeUnit value={timeLeft.minutes} label="m" />
            <TimeUnit value={timeLeft.seconds} label="s" />
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 bg-white text-blue-700 font-black text-xs px-3 py-1.5 rounded-full hover:bg-blue-50 transition-all whitespace-nowrap"
          >
            Unlock beta access
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem('announcement-dismissed', 'true');
          }}
          className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}