import Link from 'next/link'
import AuditChecklist from '@/components/AuditChecklist'
import AuditStatus from '@/components/AuditStatus'
import AuditDetailActions from '@/components/AuditDetailActions'
import AuditCollaboratePanel from '@/components/AuditCollaboratePanel'
import AccessibilityFixAll from '@/components/AccessibilityFixAll'

type TutorialChecklistItem = {
  issue: string
  fix: string
  selector?: string
  code_example?: string
  category: string
  priority?: string
  completed?: boolean
}

type TutorialAudit = {
  id: string
  website_url: string
  status: string
  is_public: boolean
  allow_collaborator_comments: boolean
  performance_score: number
  ux_score: number
  seo_score: number
  report_content: {
    summary: string
    checklist: TutorialChecklistItem[]
    completed_tasks: string[]
    third_party_tax: Array<{
      asset: string
      category: 'analytics' | 'ads' | 'chat' | 'marketing' | 'other'
      estimated_fcp_impact_ms: number
      recommendation: 'remove' | 'keep'
    }>
    total_third_party_weight_ms: number
    top_heaviest_assets: Array<{
      asset: string
      type: 'image' | 'script' | 'font' | 'other'
      estimated_impact_ms: number
      recommendation: string
    }>
    wcag_issues: Array<{
      issue: string
      selector: string
      wcag_criterion: string
      severity: 'critical' | 'high' | 'medium' | 'low'
      fix: string
    }>
    accessibility_fix_all: Array<{
      selector: string
      aria_label?: string
      alt_text?: string
    }>
  }
}

const tutorialAudit: TutorialAudit = {
  id: 'tutorial-sample-audit',
  website_url: 'https://yourstartup.com',
  status: 'completed',
  is_public: false,
  allow_collaborator_comments: true,
  performance_score: 79,
  ux_score: 82,
  seo_score: 76,
  report_content: {
    summary:
      'Your offer is promising, but visitors may miss the core value in the first screen. Clarifying the headline, tightening CTA intent, and strengthening trust proof should improve conversion confidence quickly.',
    checklist: [
      {
        issue: 'Hero headline does not state concrete outcome',
        fix: 'Rewrite hero headline to lead with the specific result users get after using your product.',
        selector: '#hero h1',
        code_example: '<h1>Book 30% more demos with conversion-first landing page audits.</h1>',
        category: 'copy',
        priority: 'high',
        completed: true,
      },
      {
        issue: 'Primary CTA lacks action clarity',
        fix: 'Update CTA text so it communicates immediate value and expected outcome.',
        selector: '.hero-cta',
        code_example: '<button>Run my free audit</button>',
        category: 'ux',
        priority: 'high',
        completed: false,
      },
      {
        issue: 'Largest hero image is not optimized',
        fix: 'Compress hero image and serve next-gen format with responsive sizes.',
        selector: '.hero img',
        code_example: '<Image src="/hero.webp" sizes="(max-width: 768px) 100vw, 1200px" />',
        category: 'performance',
        priority: 'medium',
        completed: false,
      },
      {
        issue: 'Missing descriptive alt text in logo row',
        fix: 'Add meaningful alt text for partner logos for accessibility and SEO context.',
        selector: '.trusted-by img',
        code_example: '<img alt="Trusted partner: Acme Ventures" />',
        category: 'accessibility',
        priority: 'medium',
        completed: false,
      },
      {
        issue: 'Meta title is generic and weak',
        fix: 'Create a keyword-rich title with product + audience + value proposition.',
        selector: 'head > title',
        code_example: '<title>audo — Conversion-first landing page audits for startups</title>',
        category: 'seo',
        priority: 'medium',
        completed: false,
      },
    ],
    completed_tasks: ['Hero headline does not state concrete outcome'],
    third_party_tax: [
      {
        asset: 'https://www.googletagmanager.com/gtm.js',
        category: 'analytics',
        estimated_fcp_impact_ms: 210,
        recommendation: 'keep',
      },
      {
        asset: 'https://widget.intercom.io/widget.js',
        category: 'chat',
        estimated_fcp_impact_ms: 330,
        recommendation: 'remove',
      },
    ],
    total_third_party_weight_ms: 540,
    top_heaviest_assets: [
      {
        asset: 'https://yourstartup.com/hero-image.png',
        type: 'image',
        estimated_impact_ms: 420,
        recommendation: 'Convert to WebP and reduce initial dimensions.',
      },
      {
        asset: 'https://yourstartup.com/main.js',
        type: 'script',
        estimated_impact_ms: 290,
        recommendation: 'Code-split non-critical modules and defer initialization.',
      },
      {
        asset: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700',
        type: 'font',
        estimated_impact_ms: 180,
        recommendation: 'Self-host and subset required font weights.',
      },
    ],
    wcag_issues: [
      {
        issue: 'Insufficient color contrast on CTA microcopy',
        selector: '.hero-subtext',
        wcag_criterion: '1.4.3 Contrast (Minimum)',
        severity: 'high',
        fix: 'Increase contrast ratio to at least 4.5:1 for normal text.',
      },
      {
        issue: 'CTA icon button has no accessible name',
        selector: '.hero-cta-icon',
        wcag_criterion: '4.1.2 Name, Role, Value',
        severity: 'critical',
        fix: 'Add aria-label that clearly states the action.',
      },
    ],
    accessibility_fix_all: [
      {
        selector: '.hero-cta-icon',
        aria_label: 'Run audit',
      },
      {
        selector: '.trusted-by img:nth-child(1)',
        alt_text: 'Partner logo: Acme Ventures',
      },
    ],
  },
}

function getHostname(url: string) {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    return new URL(normalized).hostname
  } catch {
    return url
  }
}

function ScoreCircle({ label, score, compact = false }: { label: string; score: number; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center ${compact ? 'h-20' : 'h-24'} px-2`}>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-black dark:text-white tabular-nums">{Math.max(0, Math.round(score || 0))}</p>
    </div>
  )
}

export default function DashboardTutorialReportPage() {
  const hostname = getHostname(tutorialAudit.website_url)
  const criticalIssueCount = tutorialAudit.report_content.wcag_issues.filter((entry) => entry.severity === 'critical').length

  return (
    <div className="print-shell min-h-screen bg-[#fcfcfc] dark:bg-slate-950 px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-12 xl:px-20 xl:py-20 relative transition-colors overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12 lg:space-y-16">
        <header className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard" className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors">
              ← Back to dashboard
            </Link>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 font-mono select-all break-all">id: tutorial-sample-audit</p>
          </div>
        </header>

        <section className="flex flex-col items-center gap-6 sm:gap-8">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black lowercase tracking-tighter text-black dark:text-white leading-[0.95] break-words">
              {hostname}
            </h1>

            <div id="tutorial-report-summary" className="mt-4 w-full max-w-2xl mx-auto">
              <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800">
                <p className="text-sm sm:text-lg lg:text-xl text-gray-500 dark:text-gray-300 leading-relaxed break-words">
                  {tutorialAudit.report_content.summary}
                </p>
              </div>
            </div>
          </div>
        </section>

        <AuditStatus audit={tutorialAudit} />

        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="rounded-[1.5rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Scores</p>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Out of 100</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ScoreCircle label="perf" score={tutorialAudit.performance_score} compact />
                <ScoreCircle label="ux" score={tutorialAudit.ux_score} compact />
                <ScoreCircle label="seo" score={tutorialAudit.seo_score} compact />
              </div>
            </section>

            <AuditDetailActions
              auditId={tutorialAudit.id}
              websiteUrl={tutorialAudit.website_url}
              canManage={false}
              summary={tutorialAudit.report_content.summary}
              checklist={tutorialAudit.report_content.checklist}
            />

            <div id="tutorial-report-collab">
              <AuditCollaboratePanel
                auditId={tutorialAudit.id}
                initialIsPublic={tutorialAudit.is_public}
                canManageShare={false}
                allowCollaboratorComments={tutorialAudit.allow_collaborator_comments}
                collaborationLocked={false}
                canManageWorkflow={false}
                viewerUserId="tutorial-user"
                viewerEmail="founder@yourstartup.com"
                invitedDeveloperEmails={['dev@yourstartup.com']}
                currentSiteUrl={tutorialAudit.website_url}
                currentScores={{
                  performance: tutorialAudit.performance_score,
                  ux: tutorialAudit.ux_score,
                  seo: tutorialAudit.seo_score,
                }}
                viewerIsOwner={false}
                monitorWeekly={false}
              />
            </div>
          </aside>

          <div className="space-y-6 sm:space-y-8">
            <div id="tutorial-report-checklist" className="relative rounded-[2rem] sm:rounded-[2.5rem]">
              <AuditChecklist
                audit={{
                  id: tutorialAudit.id,
                  report_content: {
                    checklist: tutorialAudit.report_content.checklist,
                    completed_tasks: tutorialAudit.report_content.completed_tasks,
                  },
                  checklist_comments: [],
                }}
                readOnly
                canComment={false}
                viewerEmail="founder@yourstartup.com"
              />
            </div>

            {Array.isArray(tutorialAudit.report_content.third_party_tax) && tutorialAudit.report_content.third_party_tax.length > 0 && (
              <section className="w-full rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Script Impact</p>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">3rd-Party Tax</h3>
                  </div>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-300 text-left sm:text-right break-words">
                    Total Weight: ~{Math.max(0, Math.round(Number(tutorialAudit.report_content.total_third_party_weight_ms || 0)))}ms FCP
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700">
                        <th className="py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Asset</th>
                        <th className="py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Category</th>
                        <th className="py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">FCP Impact</th>
                        <th className="py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tutorialAudit.report_content.third_party_tax.map((item, index) => (
                        <tr key={`${item.asset}-${index}`} className="border-b border-gray-100 dark:border-slate-800 last:border-b-0 align-top">
                          <td className="py-2.5 px-3 text-xs sm:text-sm text-black dark:text-white break-all">{item.asset}</td>
                          <td className="py-2.5 px-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200 uppercase">{item.category}</td>
                          <td className="py-2.5 px-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200">~{Math.max(0, Math.round(item.estimated_fcp_impact_ms))}ms</td>
                          <td className="py-2.5 px-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200">{item.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {Array.isArray(tutorialAudit.report_content.top_heaviest_assets) && tutorialAudit.report_content.top_heaviest_assets.length > 0 && (
              <section className="w-full rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-4">
                <div>
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Performance</p>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">Top Heaviest Assets</h3>
                </div>
                <div className="space-y-3">
                  {tutorialAudit.report_content.top_heaviest_assets.map((item, index) => (
                    <article key={`${item.asset}-${index}`} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 space-y-1.5">
                      <p className="text-sm font-bold text-black dark:text-white break-all">{item.asset}</p>
                      <p className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">{item.type} • ~{Math.max(0, Math.round(item.estimated_impact_ms))}ms impact</p>
                      <p className="text-xs text-gray-700 dark:text-gray-200">{item.recommendation}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {Array.isArray(tutorialAudit.report_content.wcag_issues) && tutorialAudit.report_content.wcag_issues.length > 0 && (
              <section className="w-full rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                  <div>
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Accessibility</p>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">WCAG Issues</h3>
                  </div>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-300">
                    Critical: {criticalIssueCount}
                  </p>
                </div>

                <div className="space-y-3">
                  {tutorialAudit.report_content.wcag_issues.map((issue, index) => (
                    <article key={`${issue.selector}-${index}`} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 space-y-1.5">
                      <p className="text-sm font-bold text-black dark:text-white">{issue.issue}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">{issue.wcag_criterion} • {issue.severity.toUpperCase()}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-200"><span className="font-semibold">Selector:</span> {issue.selector}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-200">{issue.fix}</p>
                    </article>
                  ))}
                </div>

                <AccessibilityFixAll fixes={tutorialAudit.report_content.accessibility_fix_all} />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
