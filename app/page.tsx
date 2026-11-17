"use client";

import { useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { Activity, ArrowRight, Check, Globe, MousePointer2, Search, ShieldCheck, UserRoundCheck } from 'lucide-react';

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
    <main className="relative min-h-screen bg-[#fcfcfb] text-[#16191f] font-sans">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[650px] overflow-hidden"><div className="absolute left-1/2 top-[-110px] h-[520px] w-[800px] max-w-full -translate-x-1/2 rounded-full bg-blue-100/70 blur-[100px]" /></div>
      <Nav />

      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:pt-24 md:pb-28">
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.06] tracking-[-0.055em] sm:text-6xl md:text-7xl">
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
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">A look inside the dashboard.</h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">Run an audit, review your scores, and track your recent work.</p>
            </div>
            <Link href="/pricing#get-audit" className="inline-flex shrink-0 items-center gap-2 pb-1 text-sm font-semibold text-blue-700 hover:text-blue-900">Explore the dashboard <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative mx-auto mt-10 max-w-5xl overflow-hidden rounded-t-[22px] border border-b-0 border-black/10 bg-white shadow-[0_24px_75px_rgba(41,68,117,0.14)]">
            <div className="flex items-center justify-between border-b border-black/10 bg-white px-5 py-3">
              <span className="text-xs font-semibold text-gray-500">Audo dashboard</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sample data</span>
            </div>
            <div className="bg-[#f7f7f5] p-4 text-black sm:p-7">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-black/10 pb-5">
                <div>
                  <h3 className="text-2xl font-black tracking-tight sm:text-3xl">Welcome back</h3>
                  <p className="mt-2 text-xs font-medium text-gray-500">Run agent audits, watch site health, and keep fixes moving.</p>
                </div>
              </header>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                {[{label:'SEO Avg',value:89,delta:'New',width:'89%'},{label:'Performance',value:84,delta:'New',width:'84%'},{label:'Accessibility',value:95,delta:'New',width:'95%'},{label:'Fixes Remaining',value:1,delta:'Open items',width:'96%'}].map(metric => (
                  <div key={metric.label} className="rounded-[1.1rem] border border-black/10 bg-white p-3 shadow-sm sm:rounded-[1.6rem] sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-1"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">{metric.label}</p><span className="text-[9px] font-bold text-emerald-600">{metric.delta}</span></div>
                    <p className="mt-3 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{metric.value}</p>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-black" style={{width:metric.width}} /></div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1.35fr_1fr]">
                <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-xl font-black tracking-tight">New Audit</h3><p className="mt-1 text-xs font-medium text-gray-500">Let the AI agent navigate your site like a real user.</p></div><span className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-600">Agent mode</span></div>
                  <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-black/10 bg-[#fafafa] p-2"><span className="min-w-0 flex-1 truncate px-2 text-xs text-gray-400">yourstartup.com or https://yourstartup.com</span><span className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white">Run Audit</span></div>
                  <p className="mt-2 text-[10px] font-medium text-gray-500">Tip: enter just a domain like useaudo.com. We auto-add https://.</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-3"><div><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Bulk Scan</p><p className="mt-1 text-[11px] text-gray-500">Scan sitemap.xml and run audits for multiple pages.</p></div><span className="rounded-xl border border-black/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider">Scan Entire Site</span></div>
                  <div className="mt-4 grid grid-cols-3 gap-2">{[{icon:MousePointer2,title:'Click & scroll',copy:'Real interaction'},{icon:UserRoundCheck,title:'Auto sign-in',copy:'Test gated flows'},{icon:ShieldCheck,title:'Bulk scan',copy:'From sitemap.xml'}].map(item => <div key={item.title} className="rounded-xl border border-black/10 bg-[#fafafa] p-2 sm:p-3"><item.icon className="h-4 w-4" /><p className="mt-2 text-[10px] font-black">{item.title}</p><p className="mt-1 text-[9px] text-gray-500">{item.copy}</p></div>)}</div>
                </div>
                <div className="rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Score Trend</p><h3 className="mt-2 text-xl font-black tracking-tight">Portfolio health</h3><p className="mt-1 text-xs text-gray-500">3 completed audits tracked</p></div><Activity className="h-5 w-5 text-gray-400" /></div>
                  <div className="mt-5 rounded-2xl bg-gradient-to-b from-slate-50 to-white p-3"><svg viewBox="0 0 360 160" className="h-32 w-full" role="img" aria-label="Sample portfolio score trend"><path d="M16 128 H344 M16 80 H344 M16 32 H344" stroke="#e5e7eb" strokeDasharray="4 4" /><path d="M16 94 L180 70 L344 51 L344 128 L16 128 Z" fill="#059669" opacity=".1" /><polyline points="16,94 180,70 344,51" fill="none" stroke="#059669" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="16" cy="94" r="5" fill="white" stroke="#059669" strokeWidth="3" /><circle cx="180" cy="70" r="5" fill="white" stroke="#059669" strokeWidth="3" /><circle cx="344" cy="51" r="5" fill="white" stroke="#059669" strokeWidth="3" /></svg></div>
                  <div className="mt-3 grid grid-cols-2 gap-2">{[{label:'Latest',value:'89',detail:'Sample audit'},{label:'Change',value:'+8',detail:'vs previous audit'}].map(stat => <div key={stat.label} className="rounded-xl border border-black/10 bg-gray-50 p-3"><p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p><p className="mt-1 text-lg font-black">{stat.value}</p><p className="text-[10px] text-gray-500">{stat.detail}</p></div>)}</div>
                </div>
              </div>
              <div className="mt-3 rounded-[1.5rem] border border-black/10 bg-white p-4 shadow-sm sm:p-6"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Audits</p><h3 className="mt-1 text-xl font-black tracking-tight">Latest runs</h3><div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 p-3"><div><p className="text-xs font-bold">https://samplesite.com</p><p className="mt-1 text-[10px] text-gray-500">Completed · Sample audit</p></div><span className="text-[10px] font-bold text-gray-500">Performance 84 · UX 95 · SEO 89</span></div></div>
            </div>
          </div>
          <p className="pb-6 pt-3 text-center text-xs text-slate-500">Dashboard preview based on Audo’s interface. Scores and activity are sample data.</p>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-24 md:pb-32">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">How it works</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">From website to next step.</h2><p className="mt-4 text-slate-600">Run an audit and decide what to fix first.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[{n:'01', title:'Share your site', text:'Enter your URL for a quick score, or create an account for the full audit.', icon:Globe},{n:'02', title:'Review the findings', text:'See suggestions for your content, usability, and technical health.', icon:Search},{n:'03', title:'Make changes', text:'Prioritize the issues, make changes, and run another audit when you are ready.', icon:MousePointer2}].map((step) => (
            <article key={step.n} className="rounded-[26px] border border-slate-200 bg-white p-7"><div className="flex items-center justify-between"><step.icon className="h-5 w-5 text-blue-600" /><span className="text-xs font-semibold text-slate-400">{step.n}</span></div><h3 className="mt-8 text-lg font-semibold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p></article>
          ))}
        </div>
      </section>

      <section id="comparison" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-10 rounded-[32px] bg-[#f4f5f7] p-8 sm:p-12 md:grid-cols-2">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Your audit</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Decide what to fix first.</h2><p className="mt-5 text-sm leading-7 text-slate-600">Keep audit findings and follow-up work together in your dashboard.</p></div>
          <div className="space-y-3">{['Review prioritized audit findings','Explore messaging, UX, SEO and performance','Re-run audits and track your progress'].map(item => <div key={item} className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-medium"><Check className="h-4 w-4 shrink-0 text-blue-600" />{item}</div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Made for founders</p>
        <blockquote className="mt-6 text-2xl font-medium leading-snug tracking-tight sm:text-3xl">“The fixes are clear, direct, and immediately useful.”</blockquote>
        <p className="mt-4 text-sm text-slate-500">Founder, WLink</p>
        <Link href="/case-studies#case-study-1" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">Read the case study <ArrowRight className="h-4 w-4" /></Link>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24"><div className="rounded-[36px] bg-blue-600 px-6 py-16 text-center text-white sm:p-20"><h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Run your first audit.</h2><p className="mx-auto mt-5 max-w-xl text-blue-100">Enter your website to get a free quick score.</p><a href="#hero-url" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">Analyze your site <ArrowRight className="h-4 w-4" /></a></div></section>
    </main>
  );
}
