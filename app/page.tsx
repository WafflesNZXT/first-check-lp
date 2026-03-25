"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Nav from '@/components/Nav';
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  DollarSign,
  Lock,
  MessageSquareText,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { AnalysisLoader } from './Analysisloader';
import { useScrollReveal } from './useScrollReveal';

type HeroResult = {
  performance: number;
  accessibility: number;
  seo: number;
  issues: string[];
  totalIssues: number;
};

function scoreColor(score: number) {
  if (score >= 90) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBg(score: number) {
  if (score >= 90) return 'bg-green-400/10 border-green-400/20';
  if (score >= 50) return 'bg-yellow-400/10 border-yellow-400/20';
  return 'bg-red-400/10 border-red-400/20';
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

export default function Home() {
  useScrollReveal();

  const [heroUrl, setHeroUrl] = useState('');
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroResult, setHeroResult] = useState<HeroResult | null>(null);
  const [heroError, setHeroError] = useState('');

  async function handleHeroSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHeroError('');
    setHeroResult(null);
    setHeroLoading(true);

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: heroUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHeroError(data?.error || 'Something went wrong. Please try again.');
        return;
      }

      setHeroResult(data as HeroResult);
    } catch {
      setHeroError('Something went wrong. Please try again.');
    } finally {
      setHeroLoading(false);
    }
  }

  function smoothScrollTo(elId: string) {
    const el = document.getElementById(elId.replace('#', ''));
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--announcement-offset') || '0', 10) || 0;
    const targetY = window.scrollY + rect.top - 24 - offset;

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans">
      <div className="absolute inset-x-0 top-0 h-[112svh] pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[linear-gradient(122deg,rgba(8,47,73,0.9)_0%,rgba(37,99,235,0.72)_34%,rgba(191,219,254,0.52)_58%,rgba(226,232,240,0.74)_74%,rgba(245,247,250,0.92)_88%,rgba(255,255,255,1)_100%)]" />
      </div>

      <Nav />

      {/* HERO */}
      <section className="relative isolate pt-16 pb-12 md:pb-12 px-6 overflow-hidden font-sans min-h-screen min-h-[100svh] z-10">

        <div className="relative z-20 max-w-6xl mx-auto mt-8 md:mt-10 lg:mt-16 mb-5 md:-mb-8 lg:-mb-14 flex items-center justify-center">
          <button
            type="button"
            onClick={() => smoothScrollTo('#ai-vs-human')}
            className="md:hidden inline-flex items-center justify-center gap-2 text-[11px] font-semibold bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 border border-blue-300/35 rounded-full px-3 py-2 text-white shadow-[0_0_24px_rgba(59,130,246,0.22)] transition-all text-center leading-tight"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200 flex-shrink-0" />
            Why AI-only audits miss context
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => smoothScrollTo('#ai-vs-human')}
            className="hidden md:inline-flex items-center gap-2 text-xs md:text-sm font-semibold bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 border border-blue-300/35 rounded-full px-4 py-2 text-white shadow-[0_0_35px_rgba(59,130,246,0.22)] hover:shadow-[0_0_45px_rgba(59,130,246,0.34)] hover:border-blue-200/60 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            Why founders don&apos;t rely on AI-only audits (Gemini, ChatGPT, Claude)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 min-h-[calc(100svh-8rem)] flex items-center md:-translate-y-4 lg:-translate-y-30">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-stretch">
            <div className="space-y-4 md:space-y-5 text-left">
              <span className="hero-badge px-4 py-1.5 text-[10px] font-black border border-white/20 bg-black/45 backdrop-blur-sm text-white rounded-full hidden md:inline-flex items-center gap-2 uppercase tracking-[0.2em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                24-Hour Human Deep-Dive
              </span>

              <h1 className="hero-title text-5xl md:text-8xl font-extrabold tracking-tighter text-white text-center md:text-left leading-[0.95] py-2 drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
                Know Exactly <br /> What To Fix.
              </h1>

              <p className="hero-subtitle text-white text-base md:text-lg max-w-2xl leading-relaxed bg-black/45 border border-white/20 rounded-2xl px-6 py-4 shadow-2xl shadow-black/40 backdrop-blur-sm">
                <span className="font-black">Get a founder-reviewed audit in 24 hours</span> with your top conversion leaks, technical blockers, and a prioritized fix plan you can ship immediately.
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-gray-200">
                <span className="inline-flex items-center gap-2 bg-black/35 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <Clock3 className="w-3.5 h-3.5 text-blue-400" />
                  Delivered in 24hrs
                </span>
                <span className="inline-flex items-center gap-2 bg-black/35 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Manual founder review
                </span>
                <span className="inline-flex items-center gap-2 bg-black/35 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  One-time $29
                </span>
              </div>
            </div>

            {/* Free Quick Score Widget */}
            <div className="relative h-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/40 via-white/10 to-transparent rounded-3xl blur opacity-80" />
              <div className="relative bg-black/45 border border-white/20 rounded-3xl px-6 pb-6 pt-8 md:px-8 md:pb-8 md:pt-10 backdrop-blur-sm h-full min-h-[430px] md:min-h-[500px] flex flex-col">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-white font-black text-xl md:text-2xl leading-none">Free Quick Score</p>
                    <p className="text-gray-300 text-xs">Instant benchmark + sample issues in under 10 seconds</p>
                  </div>
                  <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap">
                    no signup
                  </span>
                </div>

                <div className="space-y-5 flex-1 flex flex-col justify-start pt-4 md:pt-5">
                  {!heroResult ? (
                    <>
                      {heroLoading ? (
                        <AnalysisLoader />
                      ) : (
                        <>
                          <div className="space-y-2">
                            <p className="text-white font-bold text-lg leading-tight">See what&apos;s hurting trust and conversions.</p>
                            <p className="text-gray-300 text-sm leading-relaxed">Paste your URL to get instant scores and the first issues to fix. Upgrade when you want the full prioritized deep-dive.</p>
                          </div>

                          <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="url"
                              value={heroUrl}
                              onChange={(e) => setHeroUrl(e.target.value)}
                              placeholder="https://yourstartup.com"
                              required
                              className="flex-1 bg-black/35 border border-white/20 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white placeholder:text-gray-400"
                            />
                            <button
                              type="submit"
                              className="bg-white text-black border border-white font-black px-8 py-4 rounded-2xl hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap shadow-xl"
                            >
                              Get Free Score
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          </form>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300">
                            <p className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
                              <Check className="w-3.5 h-3.5 text-green-400" />
                              Results in ~10 seconds
                            </p>
                            <p className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2">
                              <Check className="w-3.5 h-3.5 text-green-400" />
                              No email or signup required
                            </p>
                          </div>
                        </>
                      )}

                      {heroError && (
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {heroError}
                        </div>
                      )}

                      <p className="hero-hint text-gray-300 text-xs leading-relaxed">
                        If the free score reveals issues, get the full 24-hour deep-dive with your top fixes ranked by impact.{" "}
                        <Link
                          href="/pricing"
                          className="text-blue-300 hover:text-white underline underline-offset-2 transition-colors"
                        >
                          See exactly what&apos;s included for $29 →
                        </Link>
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Performance', score: heroResult.performance },
                          { label: 'Accessibility', score: heroResult.accessibility },
                          { label: 'SEO', score: heroResult.seo },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className={`border rounded-2xl p-4 text-center space-y-1 ${scoreBg(item.score)}`}
                          >
                            <div className={`text-3xl font-black ${scoreColor(item.score)}`}>{item.score}</div>
                            <div className="text-white text-xs font-bold">{item.label}</div>
                            <div className={`text-[10px] font-black uppercase tracking-widest ${scoreColor(item.score)}`}>
                              {scoreLabel(item.score)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <p className="text-white font-bold text-sm">Issues found:</p>
                        {(heroResult.issues ?? []).map((issue, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300"
                          >
                            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                            {issue}
                          </div>
                        ))}

                        {heroResult.totalIssues > 3 && (
                          <div className="relative">
                            <div className="space-y-2 blur-sm pointer-events-none select-none">
                              {Array.from({ length: Math.min(heroResult.totalIssues - 3, 2) }).map((_, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300"
                                >
                                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                  {'█'.repeat(30)}
                                </div>
                              ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white">
                                <Lock className="w-4 h-4 text-blue-400" />
                                {heroResult.totalIssues - 3} more issues locked
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 space-y-4">
                        <div className="space-y-1">
                          <p className="text-white font-bold">Want to know exactly how to fix all of this?</p>
                          <p className="text-gray-400 text-sm">
                            The full Deep-Dive Audit gives you a prioritized fix list in plain English, delivered by a
                            real founder in 24 hours.
                          </p>
                        </div>
                        <Link
                          href="/pricing"
                          className="w-full bg-white text-black font-black py-3 rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          Unlock Full Audit — $29
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>

                      <button
                        onClick={() => {
                          setHeroResult(null);
                          setHeroUrl('');
                        }}
                        className="text-gray-600 text-xs hover:text-gray-400 transition-colors underline underline-offset-2 w-full text-center"
                      >
                        Try a different URL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      <div
        // className="h-40 md:h-56"
        // style={{
        //   background: 'linear-gradient(to bottom, #0a0a0a 0%, #111111 18%, #1a1a1a 34%, #2a2a2a 48%, #3c3c3c 60%, #5a5a5a 72%, #888888 84%, #c8c8c8 93%, #ffffff 100%)',
        // }}
        aria-hidden="true"
      />
      <section className="relative bg-white text-black">

        {/* AI VS HUMAN */}
        <section id="ai-vs-human" className="max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="reveal space-y-4 max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Why audo wins</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">AI gives ideas. audo gives judgment.</h2>
            <p className="text-gray-700 text-base leading-relaxed">You still get speed, but with human context and a fix order that matches your launch reality.</p>
          </div>

          <div className="reveal mt-10 relative">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
              <div className="md:col-span-3 rounded-3xl border border-black/10 bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.08)] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold">audo deep-dive</p>
                    <p className="text-xs text-gray-600">Manual audit + founder context</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3"><Check className="w-4 h-4 mt-0.5 text-blue-700" /> Prioritized fixes by conversion impact, not random categories</li>
                  <li className="flex gap-3"><Check className="w-4 h-4 mt-0.5 text-blue-700" /> Copy, trust, and positioning feedback with implementation notes</li>
                  <li className="flex gap-3"><Check className="w-4 h-4 mt-0.5 text-blue-700" /> Delivered in 24 hours with clear next actions</li>
                </ul>
              </div>

              <div className="md:col-span-2 md:-ml-10 md:mt-14 rounded-3xl border border-black/10 bg-[#f8f8f8] p-8 space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/10 flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-gray-700" /></div>
                  <p className="font-semibold">AI-only output</p>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li className="flex gap-3"><X className="w-4 h-4 mt-0.5 text-gray-500" /> Generic tips with no launch context</li>
                  <li className="flex gap-3"><X className="w-4 h-4 mt-0.5 text-gray-500" /> No opinionated priority order</li>
                  <li className="flex gap-3"><X className="w-4 h-4 mt-0.5 text-gray-500" /> Easy to spot as cookie-cutter advice</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">One day turnaround. No meetings required.</h3>
              <div className="space-y-4">
                {[
                  { step: '01', text: 'Send your site URL and checkout.' },
                  { step: '02', text: 'I run a manual trust + conversion teardown.' },
                  { step: '03', text: 'You receive a prioritized action report in 24 hours.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-4 border border-black/10 rounded-2xl px-5 py-4 bg-white">
                    <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">{s.step}</span>
                    <p className="text-sm md:text-base text-gray-800 font-medium">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative pt-6 lg:pt-0">
              <div className="rounded-3xl border border-black/10 bg-[#0f172a] text-white p-8 md:p-10 shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-200 font-bold">report snapshot</p>
                <h4 className="text-2xl font-black mt-2">Top 3 fixes that move revenue first</h4>
                <div className="mt-6 space-y-3 text-sm">
                  <p className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">Trust leak in hero message hierarchy</p>
                  <p className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">CTA friction in pricing path</p>
                  <p className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">Proof section lacks specific outcomes</p>
                </div>
              </div>
              <div className="hidden md:block absolute -bottom-6 -left-8 rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-xl">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">delivery</p>
                <p className="text-lg font-black text-black inline-flex items-center gap-2">24 hours <Clock3 className="w-4 h-4" /></p>
              </div>
            </div>
          </div>
        </section>

        {/* REAL OUTPUT PREVIEW */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal space-y-3 max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Trust through transparency</p>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">See what your actual deliverables look like.</h3>
            <p className="text-gray-600">No vague promises — these are sample views of the report and score breakdown you receive.</p>
          </div>

          <div className="reveal mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <article className="lg:col-span-7 rounded-3xl border border-black/10 bg-white p-4 md:p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
              <div className="rounded-2xl overflow-hidden border border-black/10 bg-[#f7f7f7]">
                <Image src="/audit-report-sample.svg" alt="Sample audit report output" width={1400} height={1040} className="w-full h-auto" />
              </div>
              <p className="mt-4 text-sm font-semibold text-black">Manual audit report sample</p>
              <p className="text-xs text-gray-600">Structured findings with top fixes ranked by impact and implementation speed.</p>
            </article>

            <div className="lg:col-span-5 space-y-6">
              <article className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
                <div className="rounded-2xl overflow-hidden border border-black/10 bg-[#0b1220]">
                  <Image src="/scores-overview-sample.svg" alt="Sample score summary view" width={1200} height={540} className="w-full h-auto" />
                </div>
                <p className="mt-3 text-sm font-semibold text-black">Score summary view</p>
              </article>

              <article className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.05)]">
                <div className="rounded-2xl overflow-hidden border border-black/10 bg-[#0b1220]">
                  <Image src="/performance-detail-sample.svg" alt="Sample performance detail with site preview" width={1400} height={780} className="w-full h-auto" />
                </div>
                <p className="mt-3 text-sm font-semibold text-black">Detailed metric + live page preview</p>
              </article>
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section id="comparison" className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal space-y-3 max-w-3xl">
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">Built for founders, not dashboard collectors.</h3>
            <p className="text-gray-600">Simple comparison on what actually matters before launch.</p>
          </div>

          <div className="reveal mt-10 space-y-4">
            <div className="grid grid-cols-12 rounded-3xl border border-black/10 bg-white overflow-hidden">
              <div className="col-span-4 p-5 border-r border-black/10">
                <p className="font-black text-sm">audo</p>
                <p className="text-xs text-blue-700 font-bold mt-1">$29/audit</p>
              </div>
              <div className="col-span-8 p-5 text-sm text-gray-700">Human-ranked priorities, conversion-focused execution, one-time price.</div>
            </div>
            {[
              { name: 'Ahrefs', icon: DollarSign, price: '$129/mo+', note: 'Powerful SEO data, but expensive and not conversion-priority oriented.' },
              { name: 'SEMrush', icon: Target, price: '$117/mo+', note: 'Broad toolkit for agencies; too much bloat for a startup landing page fix sprint.' },
              { name: 'SimilarWeb', icon: BrainCircuit, price: '$125/mo+', note: 'Research-focused insights; little practical UX/funnel advice for your exact page.' },
            ].map((comp) => (
              <div key={comp.name} className="grid grid-cols-12 rounded-3xl border border-black/10 bg-[#fafafa]">
                <div className="col-span-4 p-5 border-r border-black/10">
                  <p className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2"><comp.icon className="w-4 h-4" />{comp.name}</p>
                  <p className="text-xs text-gray-600 font-bold mt-1">{comp.price}</p>
                </div>
                <div className="col-span-8 p-5 text-sm text-gray-600">{comp.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* DELIVERABLES */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-3xl border border-black/10 bg-white p-8 md:p-10 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-100" />
              <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">What you get</p>
              <h3 className="mt-3 text-3xl md:text-4xl font-black tracking-tight max-w-xl">Plain-English audit with fixes you can ship immediately.</h3>
              <ul className="mt-8 space-y-3 text-sm text-gray-700 max-w-xl">
                <li className="flex gap-3"><Search className="w-4 h-4 mt-0.5 text-blue-700" /> Conversion, UX, accessibility, SEO, and performance checks</li>
                <li className="flex gap-3"><Sparkles className="w-4 h-4 mt-0.5 text-blue-700" /> Action list ordered by impact and implementation speed</li>
                <li className="flex gap-3"><MessageSquareText className="w-4 h-4 mt-0.5 text-blue-700" /> 48-hour follow-up window for clarification questions</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-black/10 bg-[#f8f8f8] p-8">
              <p className="text-sm font-bold">Launch checklist</p>
              <div className="mt-5 space-y-3">
                {['Trust messaging', 'Primary CTA clarity', 'Mobile readability', 'Page speed blockers', 'Technical SEO basics'].map((item) => (
                  <div key={item} className="rounded-xl bg-white border border-black/10 px-4 py-3 text-sm text-gray-700 inline-flex items-center gap-2 w-full">
                    <Check className="w-4 h-4 text-blue-700" />
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/pricing" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-black transition-colors">
                Get full audit <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "The fixes are clear, direct, and immediately useful.",
                author: "WLink Founder",
                href: "/case-studies#case-study-1",
              },
              {
                quote: "Helpful in understanding what to prioritize first.",
                author: "RadonFinder Founder",
                href: "/case-studies#case-study-2",
              },
              {
                quote: "Useful notes that surfaced issues I nearly missed.",
                author: "Bornday Founder",
                href: "/case-studies#case-study-3",
              },
            ].map((t) => (
              <article key={t.author} className="rounded-3xl border border-black/10 bg-white p-7 flex flex-col gap-5 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                <Quote className="w-5 h-5 text-gray-400" />
                <p className="text-gray-700 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto">
                  <p className="text-sm font-bold text-black">{t.author}</p>
                  <Link href={t.href} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-black">
                    Read case study <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-24 border-t border-black/10">
          <div className="reveal rounded-[2rem] border border-black/10 bg-black text-white p-10 md:p-14 text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Ready for your 24-hour teardown?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">Get a manual audit with direct fixes for conversion, trust, UX, performance, accessibility, and SEO.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-colors">
              Get my audit — $29 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}