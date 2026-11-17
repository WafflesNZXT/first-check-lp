"use client";

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { ArrowRight, Check, Globe, MousePointer2, Sparkles } from 'lucide-react';

type Result = {
  performance: number;
  accessibility: number;
  seo: number;
  issues?: Array<{ issue: string; fix?: string }>;
  totalIssues?: number;
};

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  function normalizedUrl() {
    const value = url.trim();
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!url.trim()) {
      setError('Please enter a website URL.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Something went wrong. Please try again.');
        return;
      }
      setResult(data as Result);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function saveResult() {
    if (!result) return;
    try {
      window.sessionStorage.setItem('audo:pending-demo-audit', JSON.stringify({
        url: normalizedUrl(), result, createdAt: Date.now(),
      }));
    } catch {
      // The dashboard remains available if browser storage is disabled.
    }
  }

  return (
    <main className="min-h-screen bg-[#fcfcfb] text-[#16191f] font-sans">
      <Nav />

      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24 md:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[800px] max-w-full -translate-x-1/2 rounded-full bg-blue-100/70 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> A fresh perspective for founders
          </span>
          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold leading-[1.06] tracking-[-0.055em] sm:text-6xl md:text-7xl">
            You built the product.<br /><span className="text-blue-600">Make the message click.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Audo reviews your website and helps you find clearer ways to turn interested visitors into customers.
          </p>
          <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_18px_60px_rgba(37,73,129,0.12)] sm:flex-row sm:rounded-full">
            <label htmlFor="hero-url" className="sr-only">Your website URL</label>
            <div className="flex flex-1 items-center gap-3 px-4">
              <Globe aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400" />
              <input id="hero-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Enter your website URL" autoComplete="url" className="min-w-0 flex-1 bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </div>
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Analyzing…' : 'Get your free score'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">No signup required for a quick score</p>
          {error && <p role="alert" className="mx-auto mt-4 max-w-xl rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {result && (
            <div aria-live="polite" className="mx-auto mt-8 max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Your quick score</p><h2 className="mt-2 text-xl font-semibold">A first look at your site</h2></div>
                <span className="text-xs text-slate-500">AI-generated estimates</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                {[['Performance', result.performance], ['UX', result.accessibility], ['SEO', result.seo]].map(([label, score]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-3 sm:p-4">
                    <p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{score}<span className="text-xs font-normal text-slate-400"> / 100</span></p>
                  </div>
                ))}
              </div>
              {!!result.issues?.length && <div className="mt-6 space-y-4"><h3 className="text-sm font-semibold">Ideas to explore</h3>{result.issues.map((item, index) => <div key={index} className="border-t border-slate-100 pt-4"><p className="text-sm font-semibold">{item.issue}</p>{item.fix && <p className="mt-1 text-sm leading-6 text-slate-600">{item.fix}</p>}</div>)}</div>}
              <Link onClick={saveResult} href="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Explore the full dashboard <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
        </div>
      </section>

      <section className="px-5 pb-20 md:pb-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 rounded-[36px] bg-[#edf3ff] p-7 sm:p-12 md:grid-cols-2 md:p-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">See your site differently</p>
            <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Small details shape the first impression.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-600">From an unclear headline to a confusing call to action, Audo helps surface opportunities to make your site easier to understand and act on.</p>
            <Link href="/pricing" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Explore Audo <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="rounded-[26px] border border-white bg-white p-6 shadow-[0_20px_60px_rgba(41,68,117,0.12)] sm:p-8">
            <div className="flex items-center justify-between"><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Example finding</span><Sparkles className="h-5 w-5 text-blue-500" /></div>
            <h3 className="mt-6 text-xl font-semibold tracking-tight">Make the headline more specific</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Help visitors understand what your product does and who it helps as soon as they arrive.</p>
            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
              <div><p className="text-xs font-semibold text-slate-400">BEFORE</p><p className="mt-1 text-sm text-slate-600">The future of customer engagement</p></div>
              <div className="border-t border-slate-200 pt-3"><p className="text-xs font-semibold text-blue-600">A CLEARER DIRECTION</p><p className="mt-1 text-sm font-semibold text-slate-800">Reply to customer messages in one place</p></div>
            </div>
            <p className="mt-4 text-xs text-slate-400">Illustrative example, not an actual audit result.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">How it works</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From website to next step.</h2><p className="mt-4 text-slate-600">A simple starting point for making your site work harder.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[{n:'01', title:'Share your site', text:'Enter your URL for a quick score, or create an account for the full audit.', icon:Globe},{n:'02', title:'Find opportunities', text:'Review suggestions across your site’s content, usability, and technical health.', icon:Sparkles},{n:'03', title:'Make your next move', text:'Use the findings to prioritize improvements and revisit your site as it evolves.', icon:MousePointer2}].map((step) => (
            <article key={step.n} className="rounded-[26px] border border-slate-200 bg-white p-7"><div className="flex items-center justify-between"><step.icon className="h-5 w-5 text-blue-600" /><span className="text-xs font-semibold text-slate-400">{step.n}</span></div><h3 className="mt-8 text-lg font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p></article>
          ))}
        </div>
      </section>

      <section id="comparison" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-10 rounded-[32px] bg-[#f4f5f7] p-8 sm:p-12 md:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Built for progress</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A clearer view of what to improve.</h2><p className="mt-5 text-sm leading-7 text-slate-600">Your dashboard brings findings and follow-up work together, so you can move from questions to a practical plan.</p></div>
          <div className="space-y-3">{['Review prioritized audit findings','Explore messaging, UX, SEO and performance','Re-run audits and track your progress'].map(item => <div key={item} className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-medium"><Check className="h-4 w-4 shrink-0 text-blue-600" />{item}</div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Made for founders</p>
        <blockquote className="mt-6 text-2xl font-medium leading-snug tracking-tight sm:text-3xl">“The fixes are clear, direct, and immediately useful.”</blockquote>
        <p className="mt-4 text-sm text-slate-500">Founder, WLink</p>
        <Link href="/case-studies#case-study-1" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Read the case study <ArrowRight className="h-4 w-4" /></Link>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24"><div className="rounded-[36px] bg-blue-600 px-6 py-16 text-center text-white sm:p-20"><h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Ready for a fresh perspective?</h2><p className="mx-auto mt-5 max-w-xl text-blue-100">Start with a quick score and discover ideas for your next improvement.</p><a href="#hero-url" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">Analyze your site <ArrowRight className="h-4 w-4" /></a></div></section>
    </main>
  );
}
