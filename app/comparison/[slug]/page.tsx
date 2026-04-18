import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { notFound } from 'next/navigation';

type ComparisonRow = {
  feature: string;
  audo: string;
  competitor: string;
};

type ComparisonPage = {
  slug: string;
  competitorName: string;
  competitorPrice: string;
  summary: string;
  rows: ComparisonRow[];
};

const COMPARISON_PAGES: Record<string, ComparisonPage> = {
  'ai-tools': {
    slug: 'ai-tools',
    competitorName: 'AI tools (Gemini, Claude, ChatGPT)',
    competitorPrice: '$20/mo+ each',
    summary:
      'General AI assistants are strong ideation partners, but they usually do not provide a repeatable conversion audit workflow with tracking, prioritization, and team-ready delivery.',
    rows: [
      { feature: 'Audit output format', audo: 'Structured conversion audit with ranked issues', competitor: 'Freeform responses that vary by prompt quality' },
      { feature: 'Prioritization logic', audo: 'Impact-first sequencing for startup landing pages', competitor: 'Suggestions are broad and often unordered' },
      { feature: 'Consistency over time', audo: 'Repeatable workflow and historical runs', competitor: 'Output can drift between sessions' },
      { feature: 'Team collaboration', audo: 'Dashboard-friendly findings for async execution', competitor: 'Manual copy/paste into docs and tickets' },
      { feature: 'Conversion focus', audo: 'Built for trust, CTA, funnel, and UX leaks', competitor: 'General advice across many topics' },
      { feature: 'Execution speed', audo: 'Action-ready fixes in one place', competitor: 'Requires prompt iteration and cleanup' },
    ],
  },
  ahrefs: {
    slug: 'ahrefs',
    competitorName: 'Ahrefs',
    competitorPrice: '$129/mo+',
    summary:
      'Ahrefs is excellent for SEO research and backlink intelligence. audo focuses on conversion and landing-page execution for founders who need faster win paths.',
    rows: [
      { feature: 'Primary job', audo: 'Conversion-first landing page audits', competitor: 'SEO intelligence and backlink analysis' },
      { feature: 'Best user', audo: 'Founders and product marketers shipping pages', competitor: 'SEO teams and content-heavy growth orgs' },
      { feature: 'Recommendation style', audo: 'Fix-first and implementation-oriented', competitor: 'Data-rich, analysis-heavy tooling' },
      { feature: 'Landing page specificity', audo: 'Prioritizes trust and CTA friction', competitor: 'Broader keyword and ranking workflows' },
      { feature: 'Workflow overhead', audo: 'Lightweight and focused', competitor: 'Higher complexity for non-SEO users' },
      { feature: 'Speed to action', audo: 'Immediate issue list to execute', competitor: 'Often needs interpretation before action' },
    ],
  },
  semrush: {
    slug: 'semrush',
    competitorName: 'SEMrush',
    competitorPrice: '$117/mo+',
    summary:
      'SEMrush offers a broad marketing suite. audo is intentionally narrow: conversion-centered landing-page audits with clear next actions for startup teams.',
    rows: [
      { feature: 'Product scope', audo: 'Focused conversion auditing', competitor: 'Multi-suite platform for many channels' },
      { feature: 'Learning curve', audo: 'Fast onboarding for non-specialists', competitor: 'Deeper platform with more setup choices' },
      { feature: 'Output clarity', audo: 'Short, prioritized fix list', competitor: 'Large report surface area to parse' },
      { feature: 'Conversion signal depth', audo: 'Centered on trust + CTA + UX blockers', competitor: 'Includes conversion info, but not core-first' },
      { feature: 'Startup fit', audo: 'Built for limited bandwidth teams', competitor: 'Best for broad marketing operations' },
      { feature: 'Action cadence', audo: 'Run, fix, rerun loop', competitor: 'Depends on broader campaign workflows' },
    ],
  },
  similarweb: {
    slug: 'similarweb',
    competitorName: 'SimilarWeb',
    competitorPrice: '$125/mo+',
    summary:
      'SimilarWeb helps with market and traffic intelligence. audo helps founders improve on-page conversion outcomes and ship practical fixes quickly.',
    rows: [
      { feature: 'Core strength', audo: 'On-page conversion improvement', competitor: 'Market and traffic benchmarking' },
      { feature: 'Decision horizon', audo: 'Immediate page-level improvements', competitor: 'Strategic research and external insights' },
      { feature: 'Fix guidance', audo: 'Specific landing-page action items', competitor: 'Limited direct implementation guidance' },
      { feature: 'Use frequency', audo: 'Weekly execution workflow', competitor: 'Periodic research and reporting cycles' },
      { feature: 'Team handoff', audo: 'Ready for PM/design/dev execution', competitor: 'Requires translation into task-level work' },
      { feature: 'Outcome orientation', audo: 'Better conversion confidence', competitor: 'Better market awareness' },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(COMPARISON_PAGES).map((slug) => ({ slug }));
}

export default async function ComparisonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = COMPARISON_PAGES[slug];

  if (!page) notFound();

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black">
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-20 space-y-10">
        <div className="space-y-5">
          <Link href="/#comparison" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700 hover:text-black transition-colors">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Back to comparison
          </Link>
          <div className="space-y-3 max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-700">Comparison</p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Audo vs {page.competitorName}</h1>
            <p className="text-base text-gray-600">{page.summary}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">Typical competitor pricing</span>
            <span className="text-xs font-black text-gray-800">{page.competitorPrice}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white overflow-hidden">
          <div className="grid grid-cols-12 border-b border-black/10 bg-[#fafafa]">
            <div className="col-span-4 p-4 md:p-5 text-xs font-black uppercase tracking-[0.14em] text-gray-500">Feature</div>
            <div className="col-span-4 p-4 md:p-5 border-l border-black/10 text-xs font-black uppercase tracking-[0.14em] text-blue-700">audo</div>
            <div className="col-span-4 p-4 md:p-5 border-l border-black/10 text-xs font-black uppercase tracking-[0.14em] text-gray-700">{page.competitorName}</div>
          </div>

          {page.rows.map((row) => (
            <div key={row.feature} className="grid grid-cols-12 border-b border-black/10 last:border-b-0">
              <div className="col-span-4 p-4 md:p-5 text-sm font-semibold text-gray-800">{row.feature}</div>
              <div className="col-span-4 p-4 md:p-5 border-l border-black/10 text-sm text-gray-700">
                <span className="inline-flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-blue-700" />
                  <span>{row.audo}</span>
                </span>
              </div>
              <div className="col-span-4 p-4 md:p-5 border-l border-black/10 text-sm text-gray-600">{row.competitor}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-black/10 bg-black text-white p-8 md:p-10 space-y-4">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Want the same format on your own landing page?</h2>
          <p className="text-sm md:text-base text-gray-300">Run an audit, get your highest-impact fixes, and track each rerun from your dashboard.</p>
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-6 py-3 text-sm font-black hover:bg-blue-600 hover:text-white transition-colors">
            Start for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
