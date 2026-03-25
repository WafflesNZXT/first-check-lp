"use client";

import { useState } from 'react';
import Link from 'next/link';
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
        <div className="absolute inset-0 bg-[linear-gradient(122deg,rgba(8,47,73,0.92)_0%,rgba(30,64,175,0.8)_34%,rgba(219,234,254,0.32)_58%,rgba(24,24,27,0.55)_74%,rgba(10,10,10,0.88)_88%,rgba(10,10,10,1)_100%)]" />
      </div>

      <Nav />

      {/* HERO */}
      <section className="relative isolate pt-16 pb-10 md:pb-12 px-6 overflow-hidden font-sans min-h-screen min-h-[100svh] z-10">

        <div className="relative z-20 max-w-6xl mx-auto mt-10 md:mt-16 -mb-10 md:-mb-14 flex items-center justify-center">
          <button
            type="button"
            onClick={() => smoothScrollTo('#ai-vs-human')}
            className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 border border-blue-300/35 rounded-full px-4 py-2 text-white shadow-[0_0_35px_rgba(59,130,246,0.22)] hover:shadow-[0_0_45px_rgba(59,130,246,0.34)] hover:border-blue-200/60 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            Why founders don&apos;t rely on AI-only audits (Gemini, ChatGPT, Claude)
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="max-w-6xl mx-auto relative z-10 min-h-[calc(100svh-8rem)] flex items-center -translate-y-3 md:-translate-y-4">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-stretch">
            <div className="space-y-5 text-left">
              <span className="hero-badge px-4 py-1.5 text-[10px] font-black border border-white/20 bg-black/45 backdrop-blur-sm text-white rounded-full inline-flex items-center gap-2 uppercase tracking-[0.2em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                24-Hour Human Deep-Dive
              </span>

              <h1 className="hero-title text-5xl md:text-8xl font-extrabold tracking-tighter text-white leading-[0.95] py-2 drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
                Know Exactly <br /> What To Fix.
              </h1>

              <p className="hero-subtitle text-white text-base md:text-lg max-w-2xl leading-relaxed bg-black/45 border border-white/20 rounded-2xl px-6 py-4 shadow-2xl shadow-black/40 backdrop-blur-sm">
                <span className="font-black">Get a founder-reviewed audit in 24 hours</span> with your top conversion leaks, technical blockers, and a prioritized fix plan you can ship immediately.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-200">
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

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* AI VS HUMAN */}
      <section id="ai-vs-human" className="relative py-24 overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute -bottom-20 left-[-10%] w-[30rem] h-[30rem] bg-blue-600/10 blur-[140px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="reveal space-y-3 max-w-3xl">
            <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Why this beats AI-only audits</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Gemini, ChatGPT, and Claude are useful. They&apos;re just not enough alone.</h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">AI gives fast ideas. First Check gives founder-level judgment, context, and a prioritized plan that matches your real funnel and launch goals.</p>
          </div>

          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-400/20 flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <p className="text-white font-bold">AI-only audit</p>
                  <p className="text-xs text-gray-500">Gemini • ChatGPT • Claude</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3"><X className="w-4 h-4 text-red-400 mt-0.5" /> Generic recommendations that miss your exact funnel stage</li>
                <li className="flex items-start gap-3"><X className="w-4 h-4 text-red-400 mt-0.5" /> No accountability for what to fix first vs. later</li>
                <li className="flex items-start gap-3"><X className="w-4 h-4 text-red-400 mt-0.5" /> Doesn&apos;t catch credibility gaps specific to your audience</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-blue-500/30 bg-blue-600/10 p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-white font-bold">First Check deep-dive</p>
                  <p className="text-xs text-blue-200">Human + context-aware review</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-gray-200">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-green-400 mt-0.5" /> Prioritized fixes ranked by conversion impact</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-green-400 mt-0.5" /> Real founder judgment on trust, offer clarity, and positioning</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-green-400 mt-0.5" /> Actionable report you can ship in 24 hours</li>
              </ul>
            </div>
          </div>

          <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100 inline-flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-300" />
              AI can suggest. It can&apos;t own your launch strategy.
            </div>
            <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-100 inline-flex items-center gap-2">
              <Check className="w-4 h-4 text-green-300" />
              You get an opinionated fix order, not a generic checklist.
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-100 inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-300" />
              One-time $29 to de-risk your launch before traffic hits.
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* THREE PILLARS */}
      <section className="relative py-24 overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 w-[34rem] h-[34rem] bg-blue-600/10 blur-[150px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="space-y-2 max-w-2xl">
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest">What you get</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">A launch-focused audit, not fluff.</h2>
              <p className="text-gray-500 text-sm md:text-base">Clear priorities, fast fixes, and a funnel that doesn’t leak when traffic finally hits.</p>
            </div>
          </div>

          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Ruthless Analysis", desc: "I don't hold back. If your copy is weak or your CTA is hidden, I'll tell you exactly how to fix it." },
              { icon: ShieldCheck, title: "Launch Standard", desc: "I check the 'boring' stuff users feel: Accessibility, Speed, and Technical Compliance." },
              { icon: Sparkles, title: "Conversion First", desc: "At the end of the day, your site exists to sell. Every tip I give is aimed at increasing your conversion rate." }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] transition-all group">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* TESTIMONIALS */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-blue-800/35 via-blue-700/20 to-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/15 via-transparent to-transparent" />
          <div className="absolute -top-20 -right-16 w-[28rem] h-[28rem] bg-blue-500/20 blur-[140px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="space-y-2 max-w-2xl">
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest">What Founders Are Saying</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Real feedback. Real founders.</h2>
              <p className="text-gray-500 text-sm md:text-base">Short, specific, and focused on what moved the needle.</p>
            </div>
          </div>

          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote: "The fixes are well articulated and concise. The audit added good notes for improvement I hadn't considered.",
              author: "WLink Founder",
              context: "SaaS / Workflow Automation",
              href: "/case-studies#case-study-1",
            },
            {
              quote: "Very good — found a couple of performance things I can optimize. Helpful in understanding what to prioritize.",
              author: "RadonFinder Founder",
              context: "Directory / B2C",
              href: "/case-studies#case-study-2",
            },
            {
              quote: "The information is genuinely useful. Even as someone who already had an idea of the issues, the audit added valuable notes.",
              author: "Bornday Founder",
              context: "Pre-launch SaaS",
              href: "/case-studies#case-study-3",
            }
          ].map((t, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 flex flex-col justify-between gap-6 hover:bg-white/[0.05] transition-all">
              <Quote className="w-6 h-6 text-blue-500/40" />
              <p className="text-gray-300 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p className="text-white font-bold text-sm">{t.author}</p>
                <p className="text-gray-400 text-xs">{t.context}</p>
              </div>
              <Link
                href={t.href}
                className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-blue-300 hover:text-white border border-blue-400/30 hover:border-white/30 bg-blue-500/10 hover:bg-white/10 rounded-full px-3 py-1.5 transition-all"
              >
                Read case study
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative py-24 overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-black" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
        <div className="reveal-scale bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black leading-none">The 24-hour <br /> Turnaround.</h2>
              <p className="text-blue-100/80 text-lg">We move at startup speed. No meetings, no long emails. Just results.</p>
              <div className="space-y-4 pt-4">
                {[
                  { step: "01", text: "Submit your URL and pay the one-time fee." },
                  { step: "02", text: "I perform a manual deep-dive on your site." },
                  { step: "03", text: "You receive a detailed audit report with prioritized fixes via email." }
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 text-white">
                    <span className="font-black text-2xl opacity-30">{s.step}</span>
                    <span className="font-bold text-lg">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                <div className="space-y-4">
                    <div className="h-2 w-24 bg-blue-400 rounded-full" />
                    <div className="h-4 w-full bg-white/10 rounded-full" />
                    <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                    <div className="pt-6 grid grid-cols-2 gap-4">
                        <div className="h-20 bg-white/5 rounded-2xl border border-white/5" />
                        <div className="h-20 bg-white/5 rounded-2xl border border-white/5" />
                    </div>
                    <div className="pt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-200">
                        <span>Analysis Processing</span>
                        <span className="animate-pulse">94% Complete</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* COMPARISON TABLE */}
      <section id="comparison" className="relative py-24 overflow-hidden bg-gradient-to-br from-blue-700/40 via-blue-700/20 to-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 w-[34rem] h-[34rem] bg-blue-500/25 blur-[160px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-blue-500/30 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 space-y-16">
        <div className="reveal text-left md:text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Built for Founders, <span className="text-gray-600">not Agencies.</span>
          </h2>
        </div>

        <div className="reveal-stagger grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 bg-[#111] border-2 border-blue-600 rounded-3xl p-8 relative shadow-2xl shadow-blue-900/20 transform transition-all duration-300">
            <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Optimal Choice</div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
              <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20"><Zap className="w-8 h-8 text-blue-400" /></div>
              <div><h3 className="text-2xl font-bold">First Check</h3><p className="text-sm text-gray-500">The Human Audit</p></div>
            </div>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> SEO + WCAG + Performance</li>
              <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> Founder-to-Founder Advice</li>
              <li className="flex items-center gap-3 text-white font-bold"><Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> Ruthless Checklist</li>
            </ul>
          </div>

          {[
            { name: "Ahrefs", price: "$129/mo+", icon: DollarSign, features: ["Restrictive 'Credit' system", "Complex backlink data", "No UX / Human insight"] },
            { name: "SEMrush", price: "$117/mo+", icon: BrainCircuit, features: ["Massive feature bloat", "Paid add-ons for AI", "Built for SEO agencies"] },
            { name: "SimilarWeb", price: "$125/mo+", icon: Target, features: ["Market research focus", "Confusing pricing tiers", "No technical UX audit"] },
          ].map((comp, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col opacity-60 hover:opacity-100 transition-all">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="bg-white/5 p-4 rounded-2xl"><comp.icon className="w-8 h-8 text-gray-600" /></div>
                <div><h3 className="text-xl font-semibold text-gray-300">{comp.name}</h3><p className="text-lg font-bold text-gray-700">{comp.price}</p></div>
              </div>
              <ul className="space-y-4 text-xs font-medium text-gray-600">
                {comp.features.map((feat, fidx) => (
                  <li key={fidx} className="flex items-start gap-3"><X className="w-4 h-4 text-red-900/40 mt-0.5" /> {feat}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* BENTO GRID */}
      <section className="relative py-24 overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-black" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div className="space-y-2 max-w-2xl">
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest">Deliverables</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Plain-English fixes you can ship.</h2>
              <p className="text-gray-500 text-sm md:text-base">No dashboards. No “maybe this matters.” Just what to change and why.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="reveal-scale md:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-12 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Detailed Written Audit.</h3>
                <p className="text-gray-400 max-w-sm">You get a prioritized, plain-English breakdown of exactly what to fix and why, delivered straight to your inbox within 24 hours. No fluff, no generic advice.</p>
                <div className="mt-8 bg-[#111] rounded-2xl border border-white/5 p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="h-3 w-48 bg-white/10 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="h-3 w-36 bg-white/10 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="h-3 w-52 bg-white/10 rounded-full" />
                  </div>
                  <div className="pt-2 text-[10px] font-black uppercase tracking-widest text-blue-400">5 Prioritized Fixes Identified</div>
                </div>
              </div>
          </div>
          <div className="reveal-scale bg-white/5 border border-white/10 rounded-[2.5rem] p-12 flex flex-col items-start text-left space-y-6">
              <div className="w-14 h-14 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/10">
                <MessageSquareText className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold">Direct Access.</h3>
              <p className="text-sm text-gray-400">Every audit includes a 48-hour window where you can ask follow-up questions via DM.</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> Prioritized fix list with clear reasoning</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> SEO, performance and accessibility scores</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> Honest UI/UX observations</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> 48-hour follow-up for clarifications</li>
              </ul>
              <Link href="/pricing" className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition">Get audit</Link>
          </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* AUDITOR SECTION */}
      <section className="relative py-24 overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -bottom-40 right-[-10%] w-[40rem] h-[40rem] bg-blue-600/10 blur-[170px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
        <div className="reveal bg-white/[0.03] border border-white/10 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-blue-500 text-white font-black text-xl flex-shrink-0">
              WS
            </div>
            <div>
              <p className="text-white font-bold text-lg italic">&ldquo;I&apos;ll personally audit your site within 24 hours.&rdquo;</p>
              <p className="text-gray-500 text-sm mt-1">Wafi Syed, Founder of First Check</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">7+</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Audits Done</div>
            </div>
            <div className="text-center border-l border-white/10 pl-6">
              <div className="text-2xl font-bold">4/5</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Avg Rating</div>
            </div>
            <div className="text-center border-l border-white/10 pl-6">
              <div className="text-2xl font-bold">24hr</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Turnaround</div>
            </div>
          </div>
        </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </section>

      {/* FINAL CTA */}
      <section className="relative py-32 overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-black" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="reveal relative z-10 space-y-10">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter">Ready for clear next steps?</h2>
          <p className="text-gray-400 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Get a manual, founder-reviewed teardown with prioritized fixes for conversion, UX, performance, accessibility, and SEO.
          </p>
          <Link href="/pricing" className="inline-flex items-center gap-3 bg-white text-black px-12 py-6 rounded-full font-black text-xl hover:bg-blue-600 hover:text-white transition-all shadow-2xl">
             GET MY 24-HOUR AUDIT — $29 <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex justify-center gap-8 text-gray-600 font-bold text-xs uppercase tracking-widest pt-8">
            <span>Manual Founder Review</span>
            <span>Prioritized Action Plan</span>
            <span>24hr Turnaround</span>
          </div>
        </div>
        </div>
      </section>
    </main>
  );
}