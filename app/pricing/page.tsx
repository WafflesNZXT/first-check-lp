"use client";

import { useCallback, useEffect, useState } from 'react';
import { Check, Zap, ArrowRight, X, FileText, BarChart3, Sparkles, ChevronRight, Loader2, CheckCircle, Layout, LayoutGrid, History as HistoryIcon, Repeat2, Share2, FileDown, Users } from 'lucide-react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import AuditExample from '@/components/AuditExample';
import { createClient } from '@/utils/supabase/client';
// Removed submitLead and client-side lead logic — checkout handled server-side

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

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
    if (!isPreviewModalOpen && !previewWorkflowModalOpen && !previewBenchmarkModalOpen) return;

    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (previewWorkflowModalOpen) {
        setPreviewWorkflowModalOpen(false);
        return;
      }
      if (previewBenchmarkModalOpen) {
        setPreviewBenchmarkModalOpen(false);
        return;
      }
      if (isPreviewModalOpen) {
        setIsPreviewModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isPreviewModalOpen, previewWorkflowModalOpen, previewBenchmarkModalOpen]);

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
    if (params.get('demo') === '1') setIsPreviewModalOpen(true);
  }, []);

  useEffect(() => {
    if (!shouldAutoCheckout || hasAutoCheckoutStarted || isRedirecting) return;

    setHasAutoCheckoutStarted(true);
    void startCheckout();
  }, [shouldAutoCheckout, hasAutoCheckoutStarted, isRedirecting, startCheckout]);

  return (
    <main className="min-h-screen bg-[#fcfcfb] text-[#16191f]">
      <Nav useHomeStyleTop />

      <section id="get-audit" className="scroll-mt-28 relative overflow-hidden px-5 pb-16 pt-16 sm:pt-24">
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-80 w-[760px] max-w-full -translate-x-1/2 rounded-full bg-blue-100/60 blur-[100px]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">Simple plans for your site.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Start with two free audits. Upgrade when you need more ways to review and share your work.</p>
        </div>
        <div className="relative mx-auto mt-10 flex max-w-5xl flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-6 py-5 text-left sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Black Friday</p><p className="mt-1 text-base font-semibold text-slate-900">Get more from your site for less.</p></div>
          <p className="text-sm font-medium text-blue-700">Audo Pro · $9/month for 12 months</p>
        </div>
        <div className="relative mx-auto mt-5 grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="flex flex-col rounded-[28px] border border-slate-200 bg-white p-8 sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight">Free</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Get started and see what Audo finds.</p>
            <p className="mt-8 text-5xl font-semibold tracking-tight">$0</p>
            <p className="mt-2 text-sm text-slate-500">No credit card required</p>
            <Link href="/signup" className="mt-8 inline-flex justify-center rounded-full border border-slate-300 px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-slate-500">Start free</Link>
            <button type="button" onClick={openPreviewModal} className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-900">Explore the dashboard demo</button>
            <div className="mt-8 border-t border-slate-100 pt-6"><p className="text-sm font-semibold">Included</p><ul className="mt-5 space-y-4">{['2 full audits','Audit details and prioritized findings','Audit history and re-runs count toward the free limit','Sharing and collaboration for your first 2 audits'].map(item=><li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><Check className="mt-1 h-4 w-4 shrink-0 text-blue-600" />{item}</li>)}</ul></div>
          </article>
          <article className="flex flex-col rounded-[28px] border border-blue-200 bg-white p-8 shadow-[0_18px_50px_rgba(37,99,235,0.08)] sm:p-10">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-semibold tracking-tight">Pro</h2><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Black Friday offer</span></div>
            <p className="mt-2 text-sm leading-6 text-slate-600">For teams and founders who ship changes regularly. Re-audit after a release, watch browser walkthroughs, and share findings with a teammate.</p>
            <p className="mt-8 flex items-baseline gap-3"><span className="text-5xl font-semibold tracking-tight">$9</span><span className="text-base font-normal text-slate-500">/ month</span><span className="text-base text-slate-400 line-through">$20</span></p>
            <p className="mt-3 text-sm leading-6 text-slate-600">$9/month for the first 12 months, then $20/month.</p>
            <button type="button" onClick={startCheckout} disabled={isRedirecting} className="mt-8 inline-flex justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{isRedirecting ? 'Opening checkout…' : 'Get Pro'}</button>
            <div className="mt-8 border-t border-slate-100 pt-6"><p className="text-sm font-semibold">Everything in Free, plus</p><ul className="mt-5 space-y-4">{['Ongoing audits and re-audits during beta','Live browser agent walkthroughs and screenshot replays','Predict tool for before-and-after copy','Sharing, developer invitations, and task assignment'].map(item=><li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><Check className="mt-1 h-4 w-4 shrink-0 text-blue-600" />{item}</li>)}</ul></div>
          </article>
        </div>
      </section>
      <AuditExample />

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <div className="rounded-[28px] bg-[#f4f6fa] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Questions about Audo?</h2>
          <div className="mt-6 divide-y divide-slate-200">
            {[
              { question: 'What is included in an audit?', answer: 'A dashboard report with findings covering areas such as UX, SEO, performance, and accessibility.' },
              { question: 'Can I try it first?', answer: 'Yes. Create a free account for two full audits, or explore the dashboard demo above.' },
              { question: 'Can I run another audit?', answer: 'Yes. Re-runs count toward the free plan limit. Pro supports ongoing audits during beta.' },
            ].map((item, index) => (
              <div key={item.question}>
                <button type="button" aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
                  {item.question}
                  <ChevronRight aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ease-out motion-reduce:transition-none ${openFaq === index ? '-rotate-90' : 'rotate-90'}`} />
                </button>
                <div id={`faq-answer-${index}`} aria-hidden={openFaq !== index} className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${openFaq === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden"><p className="max-w-2xl pb-5 text-sm leading-6 text-slate-600">{item.answer}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[260] p-3 sm:p-4 md:p-6">
          <button
            type="button"
            aria-label="Close dashboard preview"
            onClick={() => {
              setPreviewWorkflowModalOpen(false);
              setPreviewBenchmarkModalOpen(false);
              setIsPreviewModalOpen(false);
            }}
            className="absolute inset-0 bg-black/60"
          />

          <div className="relative mx-auto flex h-full w-full max-w-6xl items-start md:items-center justify-center pt-16 md:pt-0">
            <div className="w-full max-h-[90vh] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 md:px-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">Dashboard Preview</p>
                  <p className="text-sm text-gray-600 mt-1">Same product walkthrough users see on the homepage.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewWorkflowModalOpen(false);
                    setPreviewBenchmarkModalOpen(false);
                    setIsPreviewModalOpen(false);
                  }}
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
                      <div className="space-y-4">
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
