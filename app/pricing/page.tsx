"use client";

import { useCallback, useEffect, useState } from 'react';
import { Check, Zap, ArrowRight, ShieldCheck, X, FileText, Search, MessageSquareText, BarChart3, Sparkles, Linkedin, Lock, ChevronRight, AlertCircle, Loader2, Video, CheckCircle, Layout, LayoutGrid, History as HistoryIcon, Repeat2, Share2, FileDown } from 'lucide-react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { createClient } from '@/utils/supabase/client';
// Removed submitLead and client-side lead logic — checkout handled server-side
// Score color helper
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

interface ScoreResult {
  performance: number;
  accessibility: number;
  seo: number;
  issues: string[];
  totalIssues: number;
}

type PreviewChecklistItem = {
  issue: string;
  fix: string;
  category: string;
  priority: 'high' | 'medium';
  comment: string;
  completed: boolean;
};

const INITIAL_PREVIEW_CHECKLIST: PreviewChecklistItem[] = [
  {
    issue: 'Hero headline lacks specific user outcome',
    fix: 'Clarify user + pain + promised result in one line.',
    category: 'copy',
    priority: 'high',
    comment: 'This is likely costing trust on first paint.',
    completed: true,
  },
  {
    issue: 'Main CTA intent is unclear',
    fix: 'Change CTA to action + outcome and add supporting microcopy.',
    category: 'ux',
    priority: 'high',
    comment: 'Current CTA feels generic instead of outcome-driven.',
    completed: true,
  },
  {
    issue: 'Missing image alt text on partner logos',
    fix: 'Add descriptive alt text to all logo/image elements.',
    category: 'accessibility',
    priority: 'medium',
    comment: 'Needed for accessibility compliance and crawler clarity.',
    completed: false,
  },
];

function FreeScoreCard({ onUpgrade }: { onUpgrade: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setResult(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative group col-span-1 md:col-span-2">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-600 to-gray-400 rounded-[2rem] opacity-10 group-hover:opacity-20 blur transition duration-500" />
      <div className="relative bg-[#0f0f0f] border border-white/10 rounded-[1.75rem] p-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 border border-white/10 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">Free</div>
              <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-green-400">No signup needed</div>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight">Quick Score</h3>
            <p className="text-gray-500 text-sm">Enter your URL and instantly see your Performance, Accessibility, and SEO scores.</p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-4xl font-black tracking-tighter text-gray-500">Free</span>
          </div>
        </div>

        {/* Input form */}
        {!result && (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourstartup.com"
              required
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-gray-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Get Free Score
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* Score pills */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Performance', score: result.performance },
                { label: 'Accessibility', score: result.accessibility },
                { label: 'SEO', score: result.seo },
              ].map((item) => (
                <div key={item.label} className={`border rounded-2xl p-4 text-center space-y-1 ${scoreBg(item.score)}`}>
                  <div className={`text-3xl font-black ${scoreColor(item.score)}`}>{item.score}</div>
                  <div className="text-white text-xs font-bold">{item.label}</div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${scoreColor(item.score)}`}>{scoreLabel(item.score)}</div>
                </div>
              ))}
            </div>

            {/* Free issues preview */}
            <div className="space-y-3">
              <p className="text-white font-bold text-sm">Issues found:</p>
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  {issue}
                </div>
              ))}

              {/* Locked issues */}
              {result.totalIssues > 3 && (
                <div className="relative">
                  <div className="space-y-2 blur-sm pointer-events-none select-none">
                    {Array.from({ length: Math.min(result.totalIssues - 3, 3) }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-300">
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        {'█'.repeat(Math.floor(Math.random() * 20) + 20)}
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white">
                      <Lock className="w-4 h-4 text-blue-400" />
                      {result.totalIssues - 3} more issues locked
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upsell */}
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-white font-bold">Want to know exactly how to fix all of this?</p>
                <p className="text-gray-400 text-sm">Unlock dashboard access for full prioritized audits, issue history, and a workflow your team can re-run as you ship.</p>
              </div>
              <button
                onClick={onUpgrade}
                className="w-full bg-white text-black font-black py-3 rounded-xl hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                Unlock Dashboard Access — $29
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Try another URL */}
            <button
              onClick={() => { setResult(null); setUrl(''); }}
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors underline underline-offset-2 w-full text-center"
            >
              Try a different URL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Pricing() {
  const [shouldAutoCheckout, setShouldAutoCheckout] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasAutoCheckoutStarted, setHasAutoCheckoutStarted] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewView, setPreviewView] = useState<'dashboard' | 'history' | 'predict'>('dashboard');
  const [previewShareEnabled, setPreviewShareEnabled] = useState(true);
  const [previewWeeklyEnabled, setPreviewWeeklyEnabled] = useState(true);
  const [previewChecklist, setPreviewChecklist] = useState<PreviewChecklistItem[]>(INITIAL_PREVIEW_CHECKLIST);
  const [previewConfettiActive, setPreviewConfettiActive] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);

  const previewCompletedCount = previewChecklist.filter((item) => item.completed).length;
  const previewCompletionPercent = Math.round((previewCompletedCount / previewChecklist.length) * 100);

  useEffect(() => {
    if (!previewConfettiActive) return;

    const timeout = window.setTimeout(() => {
      setPreviewConfettiActive(false);
    }, 1700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [previewConfettiActive]);

  useEffect(() => {
    if (!isPreviewModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isPreviewModalOpen]);

  function togglePreviewChecklistItem(issue: string) {
    setPreviewChecklist((previousChecklist) => {
      const wasAllCompleted = previousChecklist.every((item) => item.completed);
      const nextChecklist = previousChecklist.map((item) =>
        item.issue === issue ? { ...item, completed: !item.completed } : item
      );
      const isAllCompleted = nextChecklist.every((item) => item.completed);

      if (!wasAllCompleted && isAllCompleted) {
        setPreviewConfettiActive(true);
      }

      return nextChecklist;
    });
  }

  function openPreviewModal() {
    setPreviewView('dashboard');
    setIsPreviewModalOpen(true);
  }

  // Check client-side auth first, then call checkout API — provides immediate redirect for unauthenticated users
  const startCheckout = useCallback(async () => {
    try {
      setIsRedirecting(true);

      // Client-side check to avoid sending requests to the server when not logged in
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/signup?next=${encodeURIComponent('/pricing?checkout=1')}`;
        return;
      }

      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      if (res.status === 401) {
        // Fallback: server still thinks user is unauthenticated
        window.location.href = `/signin?next=${encodeURIComponent('/pricing?checkout=1')}`;
        return;
      }

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert('Checkout error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong triggering the checkout.');
    } finally {
      setIsRedirecting(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShouldAutoCheckout(params.get('checkout') === '1');
  }, []);

  useEffect(() => {
    if (!shouldAutoCheckout || hasAutoCheckoutStarted || isRedirecting) return;

    setHasAutoCheckoutStarted(true);
    void startCheckout();
  }, [shouldAutoCheckout, hasAutoCheckoutStarted, isRedirecting, startCheckout]);

  return (
    <main className="min-h-screen bg-white text-black">
      <Nav useHomeStyleTop />

      {/* Spring Sale Banner */}
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <div className="relative overflow-hidden bg-white border border-black/10 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
          
          {/* Decorative blur */}
          <div className="absolute left-0 top-0 w-32 h-full bg-blue-100 blur-2xl pointer-events-none" />
          <div className="absolute right-0 top-0 w-32 h-full bg-blue-100 blur-2xl pointer-events-none" />
      
          <div className="relative flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <span className="bg-blue-500 text-white text-[13px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
              🌸 Spring Sale
            </span>
            <p className="text-black font-bold text-sm">
              Beta pricing is live — save 40% before it ends
            </p>
          </div>
      
          <div className="relative flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-gray-500 line-through text-sm font-bold">$49</span>
                <span className="text-black font-black text-2xl">$29/month</span>
              </div>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">beta access</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24">

        {/* Header */}
        <div className="text-center space-y-4 mb-20">
          <span className="px-4 py-1.5 text-[10px] font-black border border-blue-200 bg-blue-50 text-blue-700 rounded-full inline-flex items-center gap-2 uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Simple Pricing
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Simple beta access. No surprises.</h1>
          {/* <p className="text-gray-700 text-lg max-w-xl mx-auto">Get access to the audo dashboard to run audits, prioritize fixes, and track progress in one place.</p> */}
          <p className="text-blue-700 text-lg max-w-xl mx-auto">
            Every week you wait, you keep paying for the same drop-offs. Fix the bottleneck once, then compound.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Free Tier */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-200 to-gray-100 rounded-[2rem] opacity-80 blur transition duration-500" />
            <div className="relative bg-white border border-black/10 rounded-[1.75rem] p-8 space-y-8 shadow-[0_24px_60px_rgba(0,0,0,0.06)]">

              <div className="flex items-center justify-between">
                <div className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-700" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                  Free Plan
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold tracking-tight">Free</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Create an account free and run 2 full audits before upgrading.</p>
              </div>

              <div className="flex items-end gap-2 pb-2 border-b border-black/10">
                <span className="text-6xl font-black tracking-tighter">$0</span>
                <div className="pb-2 space-y-0.5">
                  <span className="text-gray-600 font-medium text-sm block">to start</span>
                </div>
              </div>

              <ul className="space-y-4">
                {[
                  { icon: CheckCircle, text: '2 free audits with full dashboard functionality', muted: false },
                  { icon: FileText, text: 'Full audit detail pages with issue breakdowns', muted: false },
                  { icon: Layout, text: 'Audit history and re-run workflow', muted: false },
                  { icon: X, text: 'Predict tab locked on free plan (upgrade to Pro)', muted: true },
                ].map((item, i) => (
                  <li key={i} className={`flex items-center gap-4 text-sm ${item.muted ? 'text-gray-500' : 'text-gray-700'}`}>
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${item.muted ? 'bg-gray-100 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                      <item.icon className={`w-4 h-4 ${item.muted ? 'text-gray-500' : 'text-blue-700'}`} />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={openPreviewModal}
                className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 font-black py-3 rounded-2xl hover:bg-blue-100 transition-colors"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                Preview Tool
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="-mt-2">
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white border border-black/15 text-black font-black py-4 rounded-2xl hover:bg-black hover:text-white transition-all"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-center text-gray-500 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                No credit card required.
              </p>
            </div>
          </div>

          {/* Free Score Card — full width on top
          <FreeScoreCard onUpgrade={() => setModalOpen(true)} /> */}

          {/* Main Tier */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 to-blue-100 rounded-[2rem] opacity-80 blur transition duration-500" />
            <div className="relative bg-white border border-black/10 rounded-[1.75rem] p-8 space-y-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
              
              <div className="flex items-center justify-between">
                <div className="bg-gradient-to-r from-green-200 to-pink-100 border border-gray-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-700" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                  Spring Discount
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold text-blue-700 tracking-tight">Pro</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Run structured audits inside your dashboard and unlock Predict for pre-ship forecasting.</p>
              </div>

              <div className="flex flex-col md:flex-row md:items-end gap-2 pb-2 border-b border-black/10">
              <div className="space-y-1 min-w-0">
                <span className="text-gray-600 line-through text-lg font-bold">$49</span>
                <div className="flex items-end gap-2">
                  <span className="text-6xl font-black tracking-tighter">$29/month</span>
                  {/* <div className="pb-2 space-y-0.5">
                    <span className="text-gray-700 font-medium text-sm block">(One-time payment for Beta access)</span>
                  </div> */}
                </div>
              </div>
              <div className="mt-2 md:mt-0 md:ml-auto">
                <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap">
                  40% off
                </span>
              </div>
            </div>

              <ul className="space-y-4">
              {[
                { icon: FileText, text: "Full audit detail pages with issue breakdowns" },
                { icon: Sparkles, text: "Prioritized quick wins for conversion and UX" },
                { icon: BarChart3, text: "Predict tab access for before/after content forecasting" },
                { icon: Zap, text: "Performance, SEO, and accessibility insights" },
                { icon: Layout, text: "Dashboard workflow to manage what to fix next" },
                { icon: CheckCircle, text: "Clear 'Top 3 fixes' priority list per run" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-blue-700" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>

              <button
                type="button"
                onClick={openPreviewModal}
                className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 text-blue-700 font-black py-3 rounded-2xl hover:bg-blue-100 transition-colors"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
              >
                What am I getting?
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="-mt-2">
                <button
                  onClick={startCheckout}
                  disabled={isRedirecting}
                  className="w-full bg-black text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-black/20 disabled:opacity-60"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
                >
                  {isRedirecting ? (
                    <>
                      Redirecting...
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      Get Pro
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {/* <p className="text-center text-gray-500 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                No subscription. No credit card required to start.
              </p> */}
            </div>
          </div>

          {/* Coming Soon Tier
          <div className="relative opacity-70">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] opacity-10 blur" />
            <div className="relative bg-[#0f0f0f] border border-white/5 rounded-[1.75rem] p-8 space-y-8 overflow-hidden">
              
              <div className="absolute z-20 right-[-28px] top-[28px] rotate-45 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest px-10 py-1.5 shadow-lg">
                Coming Soon
              </div>

              <div className="flex items-center justify-between">
                <div className="bg-purple-600/20 border border-purple-500/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Investor Ready
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold tracking-tight italic">The "Full Send"</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Everything in Deep-Dive, plus competitor analysis, pitch-deck alignment, and a roadmap to your first $1k MRR.</p>
              </div>

              <div className="flex items-end gap-2 pb-2 border-b border-white/5">
                <span className="text-6xl font-black tracking-tighter">$99</span>
                <div className="pb-2 space-y-0.5">
                  <span className="text-gray-500 font-medium text-sm block">/audit</span>
                  <span className="text-gray-700 text-xs block">beta access pricing</span>
                </div>
              </div>

              <ul className="space-y-4">
                {[
                  { icon: Check, text: "Everything in Deep-Dive" },
                  { icon: Check, text: "Investor Pitch-Deck Alignment" },
                  { icon: Check, text: "Mobile Performance Deep-Scan" },
                  { icon: Check, text: "Competitor Positioning Analysis" },
                  { icon: Check, text: "Priority 24hr Turnaround" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>

              <div className="pointer-events-none">
                <button className="w-full bg-white/5 text-gray-600 font-black py-4 rounded-2xl border border-white/5 cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            </div>
          </div> */}
        </div> 

        {/* Auditor Trust Strip */}
        <div className="mt-16 bg-[#fafafa] border border-black/10 rounded-3xl p-10 md:p-12 md:min-h-[180px] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-blue-500/50 overflow-hidden flex-shrink-0">
              <img src="/1770612376028.jfif" alt="Wafi Syed" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-black font-bold italic text-lg">I built audo so founders can run clear, repeatable audits in one tool.</p>
              <p className="text-gray-600 text-sm mt-0.5">Wafi Syed, Founder of audo</p>
              <div className="mt-2">
                <a href="https://www.linkedin.com/in/wafisyed/" target="_blank" rel="noopener noreferrer" aria-label="Wafi Syed on LinkedIn" className="inline-flex items-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-600 p-2.5 hover:bg-blue-500 transition-colors">
                    <Linkedin className="w-5 h-5 text-white" />
                  </span>
                </a>
              </div>
            </div>
          </div>
          {/* <div className="flex gap-6 flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold">8+</div>
              <div className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Audits Done</div>
            </div>
            <div className="text-center border-l border-black/10 pl-6">
              <div className="text-2xl font-bold">4/5</div>
              <div className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Avg Rating</div>
            </div>
            <div className="text-center border-l border-black/10 pl-6">
              <div className="text-2xl font-bold">24hr</div>
              <div className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">Dashboard-First</div>
            </div>
          </div> */}
        </div>

        {/* FAQ Strip */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { q: "What do I actually get?", a: "Dashboard access plus full audit detail views with prioritized fixes for SEO, performance, accessibility, and UX." },
            { q: "How does it work?", a: "Add your URL in the dashboard, run an audit, then track and re-run as you ship improvements." },
            { q: "Is this built for teams?", a: "Yes. The dashboard keeps audit history and priorities in one place so everyone can align on what to fix next." },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-black/10 rounded-2xl p-6 space-y-2">
              <p className="text-black font-bold text-sm">{item.q}</p>
              <p className="text-gray-600 text-xs leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

      </div>

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[90] p-4 md:p-6">
          <button
            type="button"
            aria-label="Close dashboard preview"
            onClick={() => setIsPreviewModalOpen(false)}
            className="absolute inset-0 bg-black/60"
          />

          <div className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center">
            <div className="w-full max-h-[90vh] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 md:px-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Dashboard Preview</p>
                  <p className="text-sm text-gray-600 mt-1">Same product walkthrough users see on the homepage.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-74px)]">
                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start">
                  <aside className="rounded-2xl border border-black/10 bg-white p-2.5 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewView('dashboard')}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors flex items-center gap-2 ${
                        previewView === 'dashboard' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" /> Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewView('history')}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors flex items-center gap-2 ${
                        previewView === 'history' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <HistoryIcon className="w-4 h-4" /> History
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewView('predict')}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors flex items-center gap-2 ${
                        previewView === 'predict' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> Predict
                    </button>
                  </aside>

                  <article className="rounded-2xl border border-black/10 bg-white p-4 md:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)] min-h-[520px]">
                    {previewView === 'dashboard' && (
                      <div className="space-y-4 text-black">
                        <style>{`
                          @keyframes fc-preview-confetti {
                            0% { opacity: 0; transform: translateY(-10px) rotate(0deg); }
                            12% { opacity: 1; }
                            100% { opacity: 0; transform: translateY(170px) rotate(300deg); }
                          }
                        `}</style>

                        <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white">
                          <div
                            className={`transition-[max-height] duration-500 ease-out overflow-hidden ${
                              previewExpanded ? 'max-h-[2200px]' : 'max-h-[620px]'
                            }`}
                          >
                            <div className="p-4 space-y-5">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg md:text-xl font-black tracking-tight">audo Dashboard</h3>
                              </div>

                              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Portfolio Snapshot</p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                                  <div className="rounded-xl border border-violet-100 bg-violet-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-violet-700">SEO Avg</p><p className="text-2xl font-black text-violet-900">89</p></div>
                                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-blue-700">Performance Avg</p><p className="text-2xl font-black text-blue-900">84</p></div>
                                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Accessibility Avg</p><p className="text-2xl font-black text-emerald-900">95</p></div>
                                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Fixes Remaining</p>
                                    <p className="text-2xl font-black text-amber-900">{previewChecklist.filter((it) => !it.completed).length}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">Recent Audits</p>
                                  <span className="text-xs text-gray-500">sample data</span>
                                </div>
                                <div className="rounded-xl border border-black/10 px-3 py-3">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <p className="font-bold text-sm">https://samplesite.com</p>
                                    <p className="text-xs text-gray-500">Completed · 2h ago · id: sample-001</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 mt-3">
                                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-2 text-center"><p className="text-[10px] text-gray-500 font-black uppercase">Perf</p><p className="font-black">88</p></div>
                                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-2 text-center"><p className="text-[10px] text-gray-500 font-black uppercase">UX</p><p className="font-black">100</p></div>
                                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-2 text-center"><p className="text-[10px] text-gray-500 font-black uppercase">SEO</p><p className="font-black">100</p></div>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="text-base font-black tracking-tight">Audit Detail · samplesite.com</h4>
                                  <p className="text-[11px] font-mono text-gray-500">/dashboard/audit/sample-001</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 justify-end">
                                  <button className="rounded-xl border border-black px-3 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"><Repeat2 className="w-3.5 h-3.5" /> Run Re-Audit</button>
                                  <button className="rounded-xl border border-green-300 bg-green-300 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-green-950 flex items-center gap-1.5"><FileDown className="w-3.5 h-3.5" /> Download PDF</button>
                                  <button className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" /> Social Image</button>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Share Audit</p>
                                      <p className="text-xs text-gray-600 mt-1">Anyone with the link can view this audit.</p>
                                      <p className="text-xs text-gray-400 mt-1 break-all">https://useaudo.com/sample-001/view</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <button type="button" className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider">Manage Access</button>
                                      <button type="button" className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider">Invite Developer</button>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewShareEnabled((previousValue) => !previousValue)}
                                        className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${previewShareEnabled ? 'bg-black' : 'bg-gray-300'}`}
                                        aria-pressed={previewShareEnabled}
                                        aria-label="Toggle sample share setting"
                                      >
                                        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${previewShareEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                      </button>
                                      <span className="text-[10px] uppercase tracking-wider text-gray-400">preview only</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Weekly Monitoring</p>
                                    <p className="text-xs text-gray-600 mt-1">Run this audit every week and track changes.</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewWeeklyEnabled((previousValue) => !previousValue)}
                                      className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${previewWeeklyEnabled ? 'bg-black' : 'bg-gray-300'}`}
                                      aria-pressed={previewWeeklyEnabled}
                                      aria-label="Toggle sample weekly monitoring setting"
                                    >
                                      <span className={`h-5 w-5 rounded-full bg-white transition-transform ${previewWeeklyEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                    <span className="text-[10px] uppercase tracking-wider text-gray-400">preview only</span>
                                  </div>
                                </div>

                                <section className="relative space-y-3">
                                  {previewConfettiActive && (
                                    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                                      {Array.from({ length: 24 }).map((_, index) => {
                                        const left = `${(index * 17) % 100}%`;
                                        const delay = `${(index % 8) * 60}ms`;
                                        const duration = `${1000 + (index % 5) * 120}ms`;
                                        const sizeClass = index % 2 === 0 ? 'w-1.5 h-1.5' : 'w-2 h-2';
                                        const toneClass = index % 3 === 0 ? 'bg-blue-500' : index % 3 === 1 ? 'bg-indigo-500' : 'bg-emerald-500';

                                        return (
                                          <span
                                            key={`preview-confetti-${index}`}
                                            className={`absolute top-0 rounded-sm ${sizeClass} ${toneClass}`}
                                            style={{
                                              left,
                                              animationName: 'fc-preview-confetti',
                                              animationTimingFunction: 'ease-out',
                                              animationFillMode: 'forwards',
                                              animationDelay: delay,
                                              animationDuration: duration,
                                            }}
                                          />
                                        );
                                      })}
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Checklist Progress</p>
                                    <p className="text-lg font-black">{previewCompletionPercent}%</p>
                                  </div>
                                  <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                                    <div className="h-full bg-black transition-[width] duration-300 ease-out" style={{ width: `${previewCompletionPercent}%` }} />
                                  </div>
                                  <p className="text-xs text-gray-500">{previewCompletedCount} of {previewChecklist.length} completed</p>

                                  {previewChecklist.map((item) => (
                                    <div
                                      key={item.issue}
                                      onClick={() => togglePreviewChecklistItem(item.issue)}
                                      className={`rounded-2xl border p-4 space-y-2 cursor-pointer transition-colors ${
                                        item.completed ? 'border-gray-200 bg-gray-50/70' : 'border-gray-200 bg-white hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className={`mt-0.5 inline-flex w-5 h-5 rounded-full border-2 items-center justify-center transition-colors ${item.completed ? 'border-black bg-black' : 'border-gray-300 bg-white'}`}>
                                          <Check className={`w-3 h-3 ${item.completed ? 'text-white' : 'text-gray-300'}`} />
                                        </span>
                                        <div>
                                          <p className={`font-bold text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-black'}`}>{item.issue}</p>
                                          <p className="text-xs text-gray-600 mt-1">{item.fix}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 pl-8">
                                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-500">{item.category}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${item.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                          {item.priority}
                                        </span>
                                      </div>
                                      <div className="pl-8 rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Comments</p>
                                        <p className="mt-1 text-xs text-gray-700">{item.comment}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">founder@sample.com</p>
                                      </div>
                                    </div>
                                  ))}
                                </section>
                              </div>
                            </div>
                          </div>

                          {!previewExpanded && (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
                          )}
                        </div>

                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setPreviewExpanded((previousValue) => !previousValue)}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors"
                          >
                            {previewExpanded ? 'Minimize' : 'Expand'}
                          </button>
                        </div>
                      </div>
                    )}

                    {previewView === 'history' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-black tracking-tight">Audit History</h3>
                          <p className="text-sm text-gray-500 mt-1">Search, filter, and scan all completed audits in one place.</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                          <div className="grid grid-cols-5 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <p>Site</p><p>Date</p><p>Performance</p><p>Accessibility</p><p>SEO</p>
                          </div>
                          {[
                            { site: 'samplesite.com', date: 'Apr 8', p: 88, a: 100, s: 100 },
                            { site: 'docs.samplesite.com', date: 'Apr 6', p: 81, a: 94, s: 96 },
                            { site: 'pricing.samplesite.com', date: 'Apr 3', p: 76, a: 91, s: 92 },
                          ].map((row) => (
                            <div key={row.site} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-gray-100 text-sm">
                              <p className="font-semibold">{row.site}</p>
                              <p className="text-gray-600">{row.date}</p>
                              <p className="font-bold">{row.p}</p>
                              <p className="font-bold">{row.a}</p>
                              <p className="font-bold">{row.s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewView === 'predict' && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-black tracking-tight">Predict Content Performance</h3>
                          <p className="text-sm text-gray-500 mt-1">Paste copy to forecast score shifts before shipping.</p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Draft Input</p>
                          <div className="min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                            Our AI audit helps founders ship conversion-ready pages by prioritizing fixes based on revenue impact.
                          </div>
                          <div className="mt-3 flex justify-end">
                            <button className="rounded-xl bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-widest">Run Prediction</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-gray-100 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Predicted Score</p><p className="text-3xl font-black mt-1">91</p><div className="mt-2 h-2 rounded-full bg-gray-200"><div className="h-full w-[91%] rounded-full bg-black" /></div></div>
                          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">Current Score</p><p className="text-3xl font-black mt-1 text-violet-900">83</p><div className="mt-2 h-2 rounded-full bg-violet-200"><div className="h-full w-[83%] rounded-full bg-violet-700" /></div></div>
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}