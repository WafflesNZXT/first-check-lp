"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import {
  ArrowRight,
  BrainCircuit,
  Check,
  DollarSign,
  History as HistoryIcon,
  LayoutGrid,
  MessageSquareText,
  Quote,
  Repeat2,
  Share2,
  FileDown,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useScrollReveal } from './useScrollReveal';
import TrustedByCarousel from '@/components/TrustedByCarousel';

type HeroResult = {
  performance: number;
  accessibility: number;
  seo: number;
  totalIssues?: number;
};

type PreviewChecklistItem = {
  issue: string;
  fix: string;
  category: string;
  priority: 'high' | 'medium';
  comment: string;
  completed: boolean;
};

type PreviewWorkflowTaskStatus = 'open' | 'in_progress' | 'in_review' | 'done' | 'wont_fix';
type PreviewWorkflowTaskPriority = 'low' | 'medium' | 'high' | 'critical';

type PreviewWorkflowTaskComment = {
  author: string;
  text: string;
};

type PreviewWorkflowTask = {
  id: string;
  title: string;
  sourceIssue: string;
  notes: string;
  status: PreviewWorkflowTaskStatus;
  priority: PreviewWorkflowTaskPriority;
  assignedEmail: string;
  dueDate: string;
  role: 'Creator' | 'Assigned' | 'Viewer';
  comments: PreviewWorkflowTaskComment[];
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

const PREVIEW_WORKFLOW_STATUS_OPTIONS: Array<{ value: PreviewWorkflowTaskStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'wont_fix', label: 'Won’t Fix' },
];

const PREVIEW_WORKFLOW_PRIORITY_OPTIONS: Array<{ value: PreviewWorkflowTaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const INITIAL_PREVIEW_WORKFLOW_TASKS: PreviewWorkflowTask[] = [
  {
    id: 'preview-task-1',
    title: 'Rewrite hero headline around buyer outcome',
    sourceIssue: 'Hero headline lacks specific user outcome',
    notes: 'Lead with pain + promise and tighten supporting subhead so first paint is clearer.',
    status: 'in_progress',
    priority: 'high',
    assignedEmail: 'dev@sample.com',
    dueDate: '2026-04-22',
    role: 'Creator',
    comments: [
      { author: 'founder@sample.com', text: 'Please keep this under 12 words and outcome-first.' },
      { author: 'dev@sample.com', text: 'Drafting 3 options and sharing by EOD.' },
    ],
  },
  {
    id: 'preview-task-2',
    title: 'Add alt text to partner logo strip',
    sourceIssue: 'Missing image alt text on partner logos',
    notes: 'Include descriptive alt text for accessibility and crawler clarity.',
    status: 'open',
    priority: 'medium',
    assignedEmail: 'qa@sample.com',
    dueDate: '2026-04-24',
    role: 'Assigned',
    comments: [{ author: 'qa@sample.com', text: 'I can validate this once updates are merged.' }],
  },
  {
    id: 'preview-task-3',
    title: 'Validate revised CTA copy in pricing path',
    sourceIssue: 'Main CTA intent is unclear',
    notes: 'Compare current CTA against action + outcome variant before next campaign.',
    status: 'in_review',
    priority: 'critical',
    assignedEmail: 'pm@sample.com',
    dueDate: '2026-04-25',
    role: 'Viewer',
    comments: [{ author: 'pm@sample.com', text: 'Variant is live in staging and awaiting review.' }],
  },
];

const FOUNDER_TESTIMONIALS = [
  {
    quote: 'The fixes are clear, direct, and immediately useful.',
    founder: 'Founder',
    company: 'WLink',
    href: '/case-studies#case-study-1',
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-cyan-50 to-white',
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-300/70',
    button: 'bg-emerald-500 text-white hover:bg-emerald-600',
    glow: 'from-emerald-200/80 via-cyan-200/70 to-transparent',
  },
  {
    quote: 'Helpful in understanding what to prioritize first.',
    founder: 'Founder',
    company: 'RadonFinder',
    href: '/case-studies#case-study-2',
    card: 'border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-white',
    badge: 'bg-sky-500/15 text-sky-700 border-sky-300/70',
    button: 'bg-sky-500 text-white hover:bg-sky-600',
    glow: 'from-sky-200/80 via-blue-200/70 to-transparent',
  },
  {
    quote: 'Useful notes that surfaced issues I nearly missed.',
    founder: 'Founder',
    company: 'Bornday',
    href: '/case-studies#case-study-3',
    card: 'border-violet-200 bg-gradient-to-br from-violet-50 via-indigo-50 to-white',
    badge: 'bg-violet-500/15 text-violet-700 border-violet-300/70',
    button: 'bg-violet-500 text-white hover:bg-violet-600',
    glow: 'from-violet-200/80 via-indigo-200/70 to-transparent',
  },
];

function FounderCaseStudyCard({
  testimonial,
}: {
  testimonial: {
    quote: string;
    founder: string;
    company: string;
    href: string;
    card: string;
    badge: string;
    button: string;
    glow: string;
  };
}) {
  return (
    <article className={`relative overflow-hidden rounded-3xl border p-7 flex flex-col gap-5 shadow-[0_12px_36px_rgba(0,0,0,0.08)] ${testimonial.card}`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br blur-xl ${testimonial.glow}`} />
      <div className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${testimonial.badge}`}>
        Case Study
      </div>
      <p className="text-gray-800 text-base leading-relaxed font-semibold">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-auto">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">{testimonial.founder}</p>
        <p className="text-sm font-black text-black mt-1">{testimonial.company}</p>
        <Link href={testimonial.href} className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${testimonial.button}`}>
          Read case study
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}

export default function Home() {
  useScrollReveal();

  const [heroUrl, setHeroUrl] = useState('');
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroError, setHeroError] = useState('');
  const [heroResult, setHeroResult] = useState<HeroResult | null>(null);
  const [previewView, setPreviewView] = useState<'dashboard' | 'history' | 'predict'>('dashboard');
  const [previewShareEnabled, setPreviewShareEnabled] = useState(true);
  const [previewWeeklyEnabled, setPreviewWeeklyEnabled] = useState(true);
  const [previewChecklist, setPreviewChecklist] = useState<PreviewChecklistItem[]>(INITIAL_PREVIEW_CHECKLIST);
  const [previewConfettiActive, setPreviewConfettiActive] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewWorkflowTasks, setPreviewWorkflowTasks] = useState<PreviewWorkflowTask[]>(INITIAL_PREVIEW_WORKFLOW_TASKS);
  const [previewWorkflowCommentDrafts, setPreviewWorkflowCommentDrafts] = useState<Record<string, string>>({});
  const [previewWorkflowModalOpen, setPreviewWorkflowModalOpen] = useState(false);
  const [previewBenchmarkModalOpen, setPreviewBenchmarkModalOpen] = useState(false);
  const [previewCanOpenToolModals, setPreviewCanOpenToolModals] = useState(false);

  const previewCompletedCount = previewChecklist.filter((item) => item.completed).length;
  const previewCompletionPercent = Math.round((previewCompletedCount / previewChecklist.length) * 100);
  const previewWorkflowStatusCounts = previewWorkflowTasks.reduce<Record<PreviewWorkflowTaskStatus, number>>(
    (acc, task) => {
      acc[task.status] += 1;
      return acc;
    },
    { open: 0, in_progress: 0, in_review: 0, done: 0, wont_fix: 0 }
  );

  function normalizeWebsiteUrl(rawUrl: string) {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

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
    if (!previewWorkflowModalOpen && !previewBenchmarkModalOpen) return;

    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (previewWorkflowModalOpen) {
        setPreviewWorkflowModalOpen(false);
        return;
      }
      if (previewBenchmarkModalOpen) {
        setPreviewBenchmarkModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [previewWorkflowModalOpen, previewBenchmarkModalOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const applyViewportGate = () => {
      const canOpen = mediaQuery.matches;
      setPreviewCanOpenToolModals(canOpen);
      if (!canOpen) {
        setPreviewWorkflowModalOpen(false);
        setPreviewBenchmarkModalOpen(false);
      }
    };

    applyViewportGate();
    mediaQuery.addEventListener('change', applyViewportGate);
    return () => mediaQuery.removeEventListener('change', applyViewportGate);
  }, []);

  function openPreviewWorkflowModal() {
    if (!previewCanOpenToolModals) return;
    setPreviewWorkflowModalOpen(true);
  }

  function openPreviewBenchmarkModal() {
    if (!previewCanOpenToolModals) return;
    setPreviewBenchmarkModalOpen(true);
  }

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

  function updatePreviewWorkflowTask(taskId: string, patch: Partial<Pick<PreviewWorkflowTask, 'status' | 'priority'>>) {
    setPreviewWorkflowTasks((previousTasks) =>
      previousTasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    );
  }

  function addPreviewWorkflowComment(taskId: string) {
    const nextComment = String(previewWorkflowCommentDrafts[taskId] || '').trim();
    if (!nextComment) return;

    setPreviewWorkflowTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: [...task.comments, { author: 'founder@sample.com', text: nextComment }],
            }
          : task
      )
    );
    setPreviewWorkflowCommentDrafts((previousDrafts) => ({ ...previousDrafts, [taskId]: '' }));
  }

  async function handleHeroSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHeroError('');
    setHeroResult(null);
    setHeroLoading(true);

    const normalizedUrl = normalizeWebsiteUrl(heroUrl);

    if (!normalizedUrl) {
      setHeroError('Please enter a website URL.');
      setHeroLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
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

  function getScoreTone(score: number) {
    if (score >= 90) {
      return {
        card: 'border-green-300/30 bg-green-500/10',
        value: 'text-green-200',
      };
    }

    if (score >= 50) {
      return {
        card: 'border-yellow-300/30 bg-yellow-500/10',
        value: 'text-yellow-200',
      };
    }

    return {
      card: 'border-red-300/30 bg-red-500/10',
      value: 'text-red-200',
    };
  }

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[radial-gradient(78%_34%_at_50%_0%,rgba(255,255,255,0.42)_0%,rgba(191,219,254,0.28)_35%,rgba(37,99,235,0.14)_62%,rgba(10,10,10,0)_100%),radial-gradient(120%_90%_at_38%_34%,rgba(8,47,73,0.9)_0%,rgba(37,99,235,0.72)_30%,rgba(191,219,254,0.4)_56%,rgba(226,232,240,0.2)_74%,rgba(245,247,250,0.1)_100%),radial-gradient(115%_95%_at_100%_38%,rgba(255,255,255,1)_0%,rgba(252,253,255,0.96)_34%,rgba(248,250,252,0.9)_64%,rgba(241,245,249,0.7)_100%)]" />
      </div>

      <Nav />

      {/* HERO */}
      <section className="relative isolate pt-8 md:pt-10 pb-16 md:pb-20 px-6 overflow-visible font-sans z-10">
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 h-[240px] md:h-[300px] w-[90vw] md:w-[760px] z-10 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.35)_0%,rgba(8,47,73,0.2)_45%,rgba(8,47,73,0)_75%)] blur-3xl" />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-5">
          <div className="space-y-5 text-center">
            <span className="inline-flex items-center px-3 py-1.5 border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wide text-blue-600 bg-white/50 backdrop-blur-sm">
              Pre-launch audit workflow
            </span>

            <h1 className="hero-title text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[0.95]">
              Fix what&apos;s costing you conversions.
            </h1>

            <p className="hero-subtitle text-gray-200 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Run a focused audit, get a prioritized fix list, and ship with confidence.
            </p>

            <div className="flex flex-wrap items-center gap-3 justify-center text-xs text-gray-200">
              <span className="inline-flex items-center gap-2 bg-black/30 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
                <Check className="w-3.5 h-3.5 text-blue-300" />
                No signup for quick score
              </span>
              <span className="inline-flex items-center gap-2 bg-black/30 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur-sm">
                <Check className="w-3.5 h-3.5 text-blue-300" />
                Results in ~10 seconds
              </span>
            </div>

            <div className="mx-auto max-w-xl rounded-2xl border border-blue-300/40 bg-blue-500/15 px-4 py-3">
              <p className="text-sm md:text-base font-black tracking-tight text-blue-100">Instant audit score. No signup. No paywall.</p>
            </div>

            <div className="flex items-center justify-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-blue-300/50 bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:bg-blue-500 transition-colors"
              >
                Try Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-4 relative z-20 flex flex-col">
          <div className="order-1 xl:order-2 mx-auto w-full max-w-2xl rounded-2xl border border-white/15 bg-black/35 backdrop-blur-sm px-4 py-4 md:px-5 md:py-5">
            <style>{`
              @keyframes fc-progress {
                0% { transform: translateX(-140%); }
                100% { transform: translateX(320%); }
              }
            `}</style>

            <p className="text-center text-sm md:text-base font-semibold text-blue-100 mb-3">Get a Free Audit Score</p>

            <form onSubmit={handleHeroSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="yourstartup.com or https://yourstartup.com"
                required
                className="flex-1 min-w-0 w-full bg-black/35 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-white placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={heroLoading}
                className="w-full sm:w-auto hero-cta bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white border border-blue-300/70 font-black px-6 py-3 rounded-xl hover:from-blue-500 hover:via-blue-400 hover:to-indigo-400 hover:border-blue-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap text-sm"
              >
                {heroLoading ? 'Running...' : 'Get Free Score'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="mt-3 text-center text-xs text-gray-300">Tip: you can type just a domain like useaudo.com — we auto-add https://</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setHeroUrl('youtube.com')}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-gray-100 hover:bg-white/15 transition-colors"
              >
                Try demo: youtube.com
              </button>
              <button
                type="button"
                onClick={() => setHeroUrl('google.com')}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-gray-100 hover:bg-white/15 transition-colors"
              >
                Try demo: google.com
              </button>
            </div>

            {heroLoading && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full w-1/3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"
                    style={{ animation: 'fc-progress 1.1s ease-in-out infinite' }}
                  />
                </div>
              </div>
            )}

            <p className="mt-3 text-center text-xs text-gray-300">No signup required</p>
            {heroError && <p className="mt-2 text-center text-xs text-red-300">{heroError}</p>}

            {heroResult && (
              <div className="mt-3 rounded-xl border border-white/15 bg-white/5 p-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Performance', score: heroResult.performance },
                    { label: 'Accessibility', score: heroResult.accessibility },
                    { label: 'SEO', score: heroResult.seo },
                  ].map((item) => {
                    const tone = getScoreTone(item.score);

                    return (
                      <div key={item.label} className={`rounded-lg border px-2 py-2 ${tone.card}`}>
                        <p className="text-[10px] uppercase tracking-wide text-gray-300">{item.label}</p>
                        <p className={`text-base font-black ${tone.value}`}>{item.score}</p>
                      </div>
                    );
                  })}
                </div>
                {typeof heroResult.totalIssues === 'number' && (
                  <p className="mt-2 text-center text-xs text-gray-300">
                    {heroResult.totalIssues} issues detected
                  </p>
                )}
              </div>
            )}

            {heroResult && (
              <div className="mt-4 border-t border-white/10 pt-4 text-center">
                <p className="text-sm font-semibold text-blue-100">Fix these issues for free today.</p>
                <Link
                  href="/signup"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-xs font-bold hover:bg-blue-500 hover:text-white transition-colors"
                >
                  Create Free Account
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div className="order-2 xl:order-1 mt-4">
            <TrustedByCarousel />
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-24 md:mt-32 relative z-20 translate-y-24 md:translate-y-60">
          <div className="reveal rounded-3xl border border-white/20 bg-[#f8fafc] p-4 md:p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Dashboard Preview</p>
                <p className="text-gray-600 text-sm">Replica of the real product flow with sample data.</p>
              </div>
              <p className="text-[11px] font-mono text-gray-500">/dashboard/audit/sample-001</p>
            </div>

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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
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

                            <div className="rounded-xl border border-gray-200 bg-white p-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Weekly Monitoring</p>
                                <p className="text-xs text-gray-600 mt-1">Run this audit every week and track changes.</p>
                              </div>
                              <div className="flex w-full sm:w-auto items-center justify-start sm:justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewWeeklyEnabled((previousValue) => !previousValue)}
                                  className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition-colors ${previewWeeklyEnabled ? 'bg-black' : 'bg-gray-300'}`}
                                  aria-pressed={previewWeeklyEnabled}
                                  aria-label="Toggle sample weekly monitoring setting"
                                >
                                  <span className={`h-5 w-5 rounded-full bg-white transition-transform ${previewWeeklyEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                                <span className="text-[10px] uppercase tracking-wider text-gray-400 whitespace-nowrap">preview only</span>
                              </div>
                            </div>

                            <section className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Tools</p>
                                  <h5 className="text-sm sm:text-base font-black tracking-tight text-black">Open Collaboration Modals</h5>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">Open: {previewWorkflowStatusCounts.open}</span>
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">In Progress: {previewWorkflowStatusCounts.in_progress}</span>
                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">In Review: {previewWorkflowStatusCounts.in_review}</span>
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Done: {previewWorkflowStatusCounts.done}</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={openPreviewWorkflowModal}
                                  disabled={!previewCanOpenToolModals}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                  Open Team Workflow
                                </button>
                                <button
                                  type="button"
                                  onClick={openPreviewBenchmarkModal}
                                  disabled={!previewCanOpenToolModals}
                                  className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                  Open Benchmark Compare
                                </button>
                              </div>
                              <p className="text-[11px] text-gray-500 break-words">
                                {previewCanOpenToolModals
                                  ? 'Shortcuts: W Team Workflow · B Benchmark · Esc Close modal'
                                  : 'Tool modals are disabled on smaller screens.'}
                              </p>

                              {previewWorkflowModalOpen && (
                                <div className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain flex items-start sm:items-center justify-center px-3 pb-3 pt-24 sm:p-6">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewWorkflowModalOpen(false)}
                                    className="absolute inset-0 bg-black/45"
                                    aria-label="Close team workflow"
                                  />
                                  <div className="relative z-10 w-full max-w-5xl max-h-[calc(100dvh-5.5rem)] sm:max-h-[88vh] overflow-y-auto rounded-[1.5rem] border border-gray-200 bg-[#fcfcfc] p-3 sm:p-4">
                                    <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 mb-3 flex justify-end bg-[#fcfcfc] px-3 sm:px-4 pb-2">
                                      <p className="mr-auto self-center text-[10px] uppercase tracking-widest text-gray-500">Press Esc to close</p>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewWorkflowModalOpen(false)}
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black"
                                      >
                                        Close
                                      </button>
                                    </div>

                                    <section className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                                      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                                        <div>
                                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Team Workflow</p>
                                          <h5 className="text-sm sm:text-base font-black tracking-tight text-black">Execution Board</h5>
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        {previewWorkflowTasks.map((task) => (
                                          <article key={task.id} className="rounded-xl border border-gray-200 p-3 space-y-3">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                              <div className="space-y-1">
                                                <h6 className="text-sm font-black text-black break-words">{task.title}</h6>
                                                <p className="text-xs text-gray-500 break-words">Issue: {task.sourceIssue}</p>
                                              </div>
                                              <div className="flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                                <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{task.status.replace('_', ' ')}</span>
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{task.priority}</span>
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">Due {task.dueDate}</span>
                                                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{task.role}</span>
                                              </div>
                                            </div>

                                            <p className="text-xs text-gray-700 break-words">{task.notes}</p>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                              <select
                                                value={task.status}
                                                onChange={(event) => updatePreviewWorkflowTask(task.id, { status: event.target.value as PreviewWorkflowTaskStatus })}
                                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-black"
                                              >
                                                {PREVIEW_WORKFLOW_STATUS_OPTIONS.map((statusOption) => (
                                                  <option key={statusOption.value} value={statusOption.value}>{statusOption.label}</option>
                                                ))}
                                              </select>

                                              <select
                                                value={task.priority}
                                                onChange={(event) => updatePreviewWorkflowTask(task.id, { priority: event.target.value as PreviewWorkflowTaskPriority })}
                                                className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-black"
                                              >
                                                {PREVIEW_WORKFLOW_PRIORITY_OPTIONS.map((priorityOption) => (
                                                  <option key={priorityOption.value} value={priorityOption.value}>{priorityOption.label}</option>
                                                ))}
                                              </select>

                                              <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-700 break-all">{task.assignedEmail || 'Unassigned'}</div>
                                            </div>

                                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-2">
                                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Comments</p>
                                              <div className="space-y-1.5">
                                                {task.comments.map((comment, commentIndex) => (
                                                  <p key={`${task.id}-comment-${commentIndex}`} className="text-xs text-gray-700 break-words">
                                                    <span className="font-black text-gray-500">{comment.author}: </span>
                                                    {comment.text}
                                                  </p>
                                                ))}
                                              </div>
                                              <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                  value={previewWorkflowCommentDrafts[task.id] || ''}
                                                  onChange={(event) => setPreviewWorkflowCommentDrafts((previousDrafts) => ({ ...previousDrafts, [task.id]: event.target.value }))}
                                                  placeholder="Add task comment"
                                                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-black"
                                                  maxLength={240}
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => addPreviewWorkflowComment(task.id)}
                                                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-gray-100"
                                                >
                                                  Add
                                                </button>
                                              </div>
                                            </div>
                                          </article>
                                        ))}
                                      </div>
                                    </section>
                                  </div>
                                </div>
                              )}

                              {previewBenchmarkModalOpen && (
                                <div className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain flex items-start sm:items-center justify-center px-3 pb-3 pt-24 sm:p-6">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewBenchmarkModalOpen(false)}
                                    className="absolute inset-0 bg-black/45"
                                    aria-label="Close benchmark compare"
                                  />
                                  <div className="relative z-10 w-full max-w-4xl max-h-[calc(100dvh-5.5rem)] sm:max-h-[88vh] overflow-y-auto rounded-[1.5rem] border border-gray-200 bg-[#fcfcfc] p-3 sm:p-4">
                                    <div className="sticky top-0 z-20 -mx-3 sm:-mx-4 mb-3 flex justify-end bg-[#fcfcfc] px-3 sm:px-4 pb-2">
                                      <p className="mr-auto self-center text-[10px] uppercase tracking-widest text-gray-500">Press Esc to close</p>
                                      <button
                                        type="button"
                                        onClick={() => setPreviewBenchmarkModalOpen(false)}
                                        className="rounded-xl border border-gray-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black"
                                      >
                                        Close
                                      </button>
                                    </div>

                                    <section className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Benchmark Compare</p>
                                        <h5 className="text-base font-black tracking-tight text-black">Sample Competitive Snapshot</h5>
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[{ label: 'Your Site', score: 88 }, { label: 'Category Avg', score: 79 }, { label: 'Top Competitor', score: 93 }].map((item) => (
                                          <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 break-words">{item.label}</p>
                                            <p className="mt-1 text-2xl font-black text-black">{item.score}</p>
                                            <div className="mt-2 h-2 rounded-full bg-gray-200">
                                              <div className="h-full rounded-full bg-black" style={{ width: `${item.score}%` }} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </section>
                                  </div>
                                </div>
                              )}
                            </section>

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
                  <div className="space-y-4 text-black">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Audit History</h3>
                      <p className="text-sm text-gray-500 mt-1">Search, filter, and scan all completed audits in one place.</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                      <div className="overflow-x-auto">
                        <div className="min-w-[640px] grid grid-cols-5 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500">
                          <p className="whitespace-nowrap">Site</p><p className="whitespace-nowrap">Date</p><p className="whitespace-nowrap">Performance</p><p className="whitespace-nowrap">Accessibility</p><p className="whitespace-nowrap">SEO</p>
                        </div>
                        {[
                          { site: 'samplesite.com', date: 'Apr 8', p: 88, a: 100, s: 100 },
                          { site: 'docs.samplesite.com', date: 'Apr 6', p: 81, a: 94, s: 96 },
                          { site: 'pricing.samplesite.com', date: 'Apr 3', p: 76, a: 91, s: 92 },
                        ].map((row) => (
                          <div key={row.site} className="min-w-[640px] grid grid-cols-5 gap-2 px-4 py-3 border-b border-gray-100 text-sm">
                            <p className="font-semibold whitespace-nowrap">{row.site}</p>
                            <p className="text-gray-600 whitespace-nowrap">{row.date}</p>
                            <p className="font-bold whitespace-nowrap">{row.p}</p>
                            <p className="font-bold whitespace-nowrap">{row.a}</p>
                            <p className="font-bold whitespace-nowrap">{row.s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {previewView === 'predict' && (
                  <div className="space-y-4 text-black">
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

      </section>

      <section className="relative bg-white text-black">

        {/* AI VS HUMAN */}
        <section id="ai-vs-human" className="max-w-7xl mx-auto px-6 pt-40 md:pt-48 pb-20">
          <div className="reveal space-y-4 max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">Why Audo Wins</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[0.95]">SEO tools find traffic problems. Audo fixes conversion problems.</h2>
            <p className="text-gray-700 text-base leading-relaxed">You get speed, prioritization, and a repeatable dashboard loop your team can act on.</p>
          </div>

          <div className="reveal mt-10 relative">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
              <div className="md:col-span-3 rounded-3xl border border-black/10 bg-white p-8 shadow-[0_30px_80px_rgba(0,0,0,0.08)] space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold">Audo Dashboard</p>
                    <p className="text-xs text-gray-600">Automated audits + prioritized action flow</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3"><Check className="w-4 h-4 mt-0.5 text-blue-700" /> Fixes ordered by conversion impact, not technical category</li>
                  <li className="flex gap-3"><Check className="w-4 h-4 mt-0.5 text-blue-700" /> Designed for landing pages and pre-launch sites</li>
                  <li className="flex gap-3"><Check className="w-4 h-4 mt-0.5 text-blue-700" /> Re-run as you ship to verify progress</li>
                </ul>
              </div>

              <div className="md:col-span-2 md:-ml-10 md:mt-14 rounded-3xl border border-black/10 bg-[#f8f8f8] p-8 space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-black/10 flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-gray-700" /></div>
                  <p className="font-semibold">AI-only output</p>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-600">
                  <li className="flex gap-3"><X className="w-4 h-4 mt-0.5 text-gray-500" /> No landing page context — just generic site-wide tips</li>
                  <li className="flex gap-3"><X className="w-4 h-4 mt-0.5 text-gray-500" /> Can&apos;t tell you why visitors aren&apos;t converting</li>
                  <li className="flex gap-3"><X className="w-4 h-4 mt-0.5 text-gray-500" /> Not built around your specific launch goals</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <div className="max-w-4xl mx-auto px-6 mt-8 md:mt-10 mb-10">
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-r from-[#071125]/60 via-[#0b1220]/60 to-[#071125]/60 p-6 md:p-8 backdrop-blur-sm shadow-[0_30px_80px_rgba(2,6,23,0.6)] hover:shadow-[0_40px_100px_rgba(2,6,23,0.72)] transition-all transform hover:-translate-y-1 overflow-hidden">
            <div className="absolute left-0 inset-y-0 w-2 bg-blue-500 rounded-l-2xl" />
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 mt-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <Quote className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-lg md:text-xl text-white font-extrabold leading-relaxed" style={{ textShadow: '0 6px 18px rgba(0,0,0,0.45)' }}>I implemented Audo’s suggested changes to my landing page and saw sales immediately after. The audit highlighted exactly where my messaging was falling short. Highly recommend for any founder looking to clarify their value prop.</p>
                <div className="mt-4">
                  <p className="inline-flex items-center gap-3 text-sm text-blue-200 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> — Founder, Market Ontology
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <h3 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Set up in minutes. Keep improving weekly.</h3>
              <div className="space-y-4">
                {[
                  { step: '01', text: 'Create your account and open the dashboard.' },
                  { step: '02', text: 'Run an audit on your URL and review prioritized issues.' },
                  { step: '03', text: 'Ship fixes, re-run, and track progress over time.' },
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
                <p className="text-xs uppercase tracking-[0.16em] text-blue-200 font-bold">dashboard snapshot</p>
                <h4 className="text-2xl font-black mt-2">Top 3 fixes that move revenue first</h4>
                <div className="mt-6 space-y-3 text-sm">
                  <p className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">Trust leak in hero message hierarchy</p>
                  <p className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">CTA friction in pricing path</p>
                  <p className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">Proof section lacks specific outcomes</p>
                </div>
              </div>
              {/* <div className="hidden md:block absolute -bottom-6 -left-8 rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-xl">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">delivery</p>
                <p className="text-lg font-black text-black inline-flex items-center gap-2">Live in dashboard <Clock3 className="w-4 h-4" /></p>
              </div> */}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal max-w-2xl mx-auto">
            <FounderCaseStudyCard testimonial={FOUNDER_TESTIMONIALS[0]} />
          </div>
        </section>

        {/* COMPARISON */}
        <section id="comparison" className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal space-y-3 max-w-3xl">
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">Different problem. Different tool.</h3>
            <p className="text-gray-600">Ahrefs and SEMrush help you rank. audo helps you convert. They&apos;re not the same problem.</p>
          </div>

          <div className="reveal mt-10 space-y-4">
            <div className="grid grid-cols-12 rounded-3xl border border-black/10 bg-white overflow-hidden">
              <div className="col-span-4 p-5 border-r border-black/10">
                <p className="font-black text-sm">audo</p>
                <p className="text-xs text-blue-700 font-bold mt-1">$29/month</p>
              </div>
              <div className="col-span-8 p-5 text-sm text-gray-700">Conversion-focused audits with prioritized fixes. Built for landing pages, not agency dashboards.</div>
            </div>
            {[
              {
                name: 'AI tools (Gemini, Claude, ChatGPT)',
                icon: Sparkles,
                price: '$20/mo+ each',
                note: 'Great for brainstorming, but outputs are generic and not a structured, prioritized audit of your specific landing page.',
                href: '/comparison/ai-tools',
              },
              {
                name: 'Ahrefs',
                icon: DollarSign,
                price: '$129/mo+',
                note: 'Powerful SEO data, but expensive and not conversion-priority oriented.',
                href: '/comparison/ahrefs',
              },
              {
                name: 'SEMrush',
                icon: Target,
                price: '$117/mo+',
                note: 'Broad toolkit for agencies; too much bloat for a startup landing page fix sprint.',
                href: '/comparison/semrush',
              },
              {
                name: 'SimilarWeb',
                icon: BrainCircuit,
                price: '$125/mo+',
                note: 'Research-focused insights; little practical UX/funnel advice for your exact page.',
                href: '/comparison/similarweb',
              },
            ].map((comp) => (
              <div key={comp.name} className="grid grid-cols-12 rounded-3xl border border-black/10 bg-[#fafafa]">
                <div className="col-span-4 p-5 border-r border-black/10">
                  <p className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2"><comp.icon className="w-4 h-4" />{comp.name}</p>
                  <p className="text-xs text-gray-600 font-bold mt-1">{comp.price}</p>
                </div>
                <div className="col-span-8 p-5 space-y-3">
                  <p className="text-sm text-gray-600">{comp.note}</p>
                  <Link href={comp.href} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-700 hover:text-black transition-colors">
                    See more
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal mt-12 max-w-2xl mx-auto">
            <FounderCaseStudyCard testimonial={FOUNDER_TESTIMONIALS[1]} />
          </div>
        </section>

        {/* DELIVERABLES */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-black/10">
          <div className="reveal grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-3xl border border-black/10 bg-white p-8 md:p-10 relative overflow-hidden">
              <div className="hidden md:block absolute -right-16 -top-12 w-44 h-44 rounded-full bg-blue-100 -z-10 pointer-events-none" />
              <div className="block md:hidden absolute right-3 -top-6 w-20 h-20 rounded-full bg-blue-100 opacity-80 -z-10 pointer-events-none" />
              <p className="text-xs uppercase tracking-[0.2em] text-blue-700 font-black">What you get</p>
              <h3 className="mt-3 text-3xl md:text-4xl font-black tracking-tight max-w-xl">Dashboard audits with fixes you can ship immediately.</h3>
              <ul className="mt-8 space-y-3 text-sm text-gray-700 max-w-xl">
                <li className="flex gap-3"><Search className="w-4 h-4 mt-0.5 text-blue-700" /> Conversion, UX, accessibility, SEO, and performance checks</li>
                <li className="flex gap-3"><Sparkles className="w-4 h-4 mt-0.5 text-blue-700" /> Action list ordered by impact and implementation speed</li>
                <li className="flex gap-3"><MessageSquareText className="w-4 h-4 mt-0.5 text-blue-700" /> Dashboard history for each run so your team can track progress</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-black/10 bg-[#f8f8f8] p-8">
              <p className="text-sm font-bold">Core focus areas</p>
              <div className="mt-5 space-y-3">
                {['Trust messaging', 'Primary CTA clarity', 'Mobile readability', 'Page speed blockers', 'Technical SEO basics'].map((item) => (
                  <div key={item} className="rounded-xl bg-white border border-black/10 px-4 py-3 text-sm text-gray-700 inline-flex items-center gap-2 w-full">
                    <Check className="w-4 h-4 text-blue-700" />
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/pricing" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-black transition-colors">
                View dashboard access <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="reveal mt-12 max-w-2xl mx-auto">
            <FounderCaseStudyCard testimonial={FOUNDER_TESTIMONIALS[2]} />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-7xl mx-auto px-6 pt-8 pb-24 border-t border-black/10">
          <div className="reveal rounded-[2rem] border border-black/10 bg-black text-white p-10 md:p-14 text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Ready to run your first audit?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">Get instant scoring, prioritized fixes, and a repeatable audit workflow your team can use every week.</p>
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-black hover:bg-blue-600 hover:text-white transition-colors">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}