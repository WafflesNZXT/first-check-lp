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
  const [auditedUrl, setAuditedUrl] = useState('');

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
    const submittedUrl = normalizedUrl();
    try {
      const parsed = new URL(submittedUrl);
      if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error();
    } catch {
      setError('Please enter a valid website address, like example.com.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittedUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Something went wrong. Please try again.');
        return;
      }
      setAuditedUrl(submittedUrl);
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
        url: auditedUrl, result, createdAt: Date.now(),
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
              <input id="hero-url" value={url} onChange={(event) => { setUrl(event.target.value); setError(''); setResult(null); }} disabled={loading} placeholder="Enter your website URL" autoComplete="url" inputMode="url" className="min-w-0 flex-1 bg-transparent py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500" />
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
                <span className="text-xs text-slate-500">AI-generated estimates · {auditedUrl}</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                {[['Performance', result.performance], ['UX', result.accessibility], ['SEO', result.seo]].map(([label, score]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-3 sm:p-4">
                    <p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{score}<span className="text-xs font-normal text-slate-400"> / 100</span></p>
                  </div>
                ))}
              </div>
              {!!result.issues?.length && <div className="mt-6 space-y-4"><h3 className="text-sm font-semibold">Ideas to explore</h3>{result.issues.map((item, index) => <div key={index} className="border-t border-slate-100 pt-4"><p className="text-sm font-semibold">{item.issue}</p>{item.fix && <p className="mt-1 text-sm leading-6 text-slate-600">{item.fix}</p>}</div>)}</div>}
              <Link onClick={saveResult} href="/signup?next=%2Fdashboard%3FresumeDemo%3D1" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900">Explore the full dashboard <ArrowRight className="h-4 w-4" /></Link>
            </div>
          )}
        </div>
      </section>

      <section className="px-5 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[#edf3ff] px-6 pt-10 sm:px-12 sm:pt-14 md:px-16 md:pt-16">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">A look inside Audo</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Your next improvement, in view.</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">See your website scores, review findings, and keep track of what to fix next—all in one place.</p>
            </div>
            <Link href="/pricing#get-audit" className="inline-flex shrink-0 items-center gap-2 pb-1 text-sm font-semibold text-blue-700 hover:text-blue-900">Explore the dashboard <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-t-[22px] border border-b-0 border-slate-200 bg-white shadow-[0_24px_75px_rgba(41,68,117,0.17)]">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-6">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-slate-300" /><span aria-hidden="true" className="h-2 w-2 rounded-full bg-slate-300" /><span aria-hidden="true" className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="ml-3 text-xs font-medium text-slate-400">Audo dashboard</span><span className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-700">SAMPLE DATA</span>
            </div>
            <div className="grid gap-4 bg-[#fafbfe] p-4 sm:p-6 md:grid-cols-[1.05fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-5">
                  <div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Portfolio snapshot</p><h3 className="mt-1 text-lg font-semibold">Your site at a glance</h3></div><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Globe className="h-4 w-4" /></div></div>
                  <div className="mt-5 grid grid-cols-3 gap-2">{[{label:'SEO',score:'89'},{label:'Performance',score:'84'},{label:'UX',score:'95'}].map(metric => <div key={metric.label} className="rounded-xl bg-slate-50 px-3 py-3"><p className="text-[10px] text-slate-500">{metric.label}</p><p className="mt-1 text-xl font-semibold text-slate-800">{metric.score}</p></div>)}</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recent audits</p><div className="mt-4 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2 text-blue-600"><Globe className="h-4 w-4" /></div><div><p className="text-sm font-semibold">samplesite.com</p><p className="mt-0.5 text-xs text-slate-400">Completed · Sample audit</p></div><span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Complete</span></div></div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Audit detail</p><h3 className="mt-1 text-lg font-semibold">Findings to explore</h3></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">CHECKLIST</span></div>
                <div className="mt-5 space-y-3">{[{title:'Hero headline lacks a specific outcome',detail:'Clarify who you help and the result you offer.',tag:'COPY'},{title:'Main CTA intent is unclear',detail:'Make the next step easier to understand.',tag:'UX'},{title:'Add alt text to partner logos',detail:'Give images descriptive accessible labels.',tag:'ACCESSIBILITY'}].map(finding => <div key={finding.title} className="rounded-xl border border-slate-100 p-3.5"><div className="flex items-start gap-2"><span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-slate-300" /><div><p className="text-xs font-semibold text-slate-800">{finding.title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{finding.detail}</p><p className="mt-2 text-[9px] font-semibold tracking-wider text-blue-600">{finding.tag}</p></div></div></div>)}</div>
              </div>
            </div>
          </div>
          <p className="pb-6 pt-3 text-center text-xs text-slate-500">Illustrative dashboard preview using sample data.</p>
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
