import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AuditChecklist from '../../../../components/AuditChecklist'
import AuditStatus from '../../../../components/AuditStatus'
import EmailAuditButton from '../../../../components/EmailAuditButton'
import AuditShareControls from '../../../../components/AuditShareControls'
import AuditDetailActions from '../../../../components/AuditDetailActions'
import AuditDetailModals from '../../../../components/AuditDetailModals'
import WeeklyMonitoringToggle from '../../../../components/WeeklyMonitoringToggle'
import { Logo } from '../../../../components/Logo'
import AccessibilityFixAll from '../../../../components/AccessibilityFixAll'
import { getUserFromCookie } from '@/lib/auth'

type ChecklistItem = {
  issue: string
  fix: string
  selector?: string
  code_example?: string
  category: string
  priority?: string
  completed?: boolean
}

type AuditReport = {
  summary?: string
  checklist?: ChecklistItem[]
  completed_tasks?: string[]
  top_heaviest_assets?: HeaviestAsset[]
  third_party_tax?: ThirdPartyTaxItem[]
  total_third_party_weight_ms?: number
  wcag_issues?: WcagIssue[]
  accessibility_fix_all?: AccessibilityFix[]
}

type HeaviestAsset = {
  asset: string
  type: 'image' | 'script' | 'font' | 'other'
  estimated_impact_ms: number
  recommendation: string
}

type ThirdPartyTaxItem = {
  asset: string
  category: 'analytics' | 'ads' | 'chat' | 'marketing' | 'other'
  estimated_fcp_impact_ms: number
  recommendation: 'remove' | 'keep'
}

type WcagIssue = {
  issue: string
  selector: string
  wcag_criterion: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  fix: string
}

type AccessibilityFix = {
  selector: string
  aria_label?: string
  alt_text?: string
}

type AuditRecord = {
  id: string
  user_id: string
  is_public: boolean | null
  website_url: string
  report_content: AuditReport | null
  performance_score: number
  ux_score: number
  seo_score: number
  status: string
  created_at: string
  screenshot_url: string | null
  monitor_weekly?: boolean | null
  allow_collaborator_comments?: boolean | null
  checklist_comments?: ChecklistComment[] | null
}

type ChecklistComment = {
  id: string
  issue: string
  text: string
  author_email: string
  created_at: string
}

type ProfileRecord = {
  plan_type: string | null
  audit_count: number | null
} | null

type PreviousAuditScores = {
  performance_score: number
  ux_score: number
  seo_score: number
} | null

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies()
  const { id } = await params
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )

  const { data: audit, error } = await supabase
    .from('audits')
    .select('id, user_id, is_public, website_url, report_content, performance_score, ux_score, seo_score, status, created_at, screenshot_url, allow_collaborator_comments, checklist_comments')
    .eq('id', id)
    .single()

  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-2">Audit not found</h2>
        <pre className="text-sm bg-red-50 p-4 rounded">{String(error.message)}</pre>
        <p className="mt-2 text-xs text-gray-500">requested id: {id}</p>
      </div>
    )
  }

  const typedAudit = audit as AuditRecord | null

  if (!typedAudit) return <div>Audit not found — no row for id {id}</div>

  let hostname = "unknown site";
    try {
    const urlToParse = typedAudit.website_url.startsWith('http') 
      ? typedAudit.website_url 
      : `https://${typedAudit.website_url}`;
    hostname = new URL(urlToParse).hostname;
    } catch {
    hostname = typedAudit.website_url; // Fallback to raw input
    }

  let currentUser = getUserFromCookie(cookieStore)
  if (!currentUser) {
    const { data } = await supabase.auth.getUser()
    currentUser = data.user ? { id: data.user.id, email: data.user.email ?? null } : null
  }
  if (!currentUser) redirect(`/signin?next=${encodeURIComponent(`/dashboard/audit/${id}`)}`)

  const userId = currentUser.id
  const isOwner = userId === typedAudit.user_id

  let collaboratorAccess: 'view' | 'edit' | null = null
  if (!isOwner && currentUser.email) {
    const normalizedEmail = currentUser.email.toLowerCase()
    const { data: shareRow } = await supabase
      .from('audit_shares')
      .select('access_level')
      .eq('audit_id', typedAudit.id)
      .eq('shared_with_email', normalizedEmail)
      .maybeSingle()

    const accessLevel = String((shareRow as { access_level?: string } | null)?.access_level || 'view').toLowerCase()
    if (accessLevel === 'view' || accessLevel === 'edit') {
      collaboratorAccess = accessLevel
    }
  }

  if (!isOwner && !collaboratorAccess) redirect('/dashboard')

  const canEditChecklist = isOwner || collaboratorAccess === 'edit'
  const canComment = isOwner || (!!typedAudit.allow_collaborator_comments && !!collaboratorAccess)

  const { data: shareRows } = await supabase
    .from('audit_shares')
    .select('shared_with_email')
    .eq('audit_id', typedAudit.id)

  const invitedDeveloperEmails = Array.from(
    new Set(
      [
        ...(Array.isArray(shareRows)
          ? shareRows
              .map((row) => String((row as { shared_with_email?: string }).shared_with_email || '').trim().toLowerCase())
              .filter(Boolean)
          : []),
      ].filter(Boolean)
    )
  )

  let profile: ProfileRecord = null
  if (isOwner && userId) {
    const { data } = await supabase
      .from('profiles')
      .select('plan_type, audit_count')
      .eq('id', userId)
      .maybeSingle()
    profile = data
  }

  let previousScores: PreviousAuditScores = null
  if (typedAudit.status === 'completed') {
    const { data } = await supabase
      .from('audits')
      .select('performance_score, ux_score, seo_score')
      .eq('user_id', userId)
      .eq('website_url', typedAudit.website_url)
      .eq('status', 'completed')
      .lt('created_at', typedAudit.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    previousScores = data as PreviousAuditScores
  }

  let monitorWeekly = false
  const { data: monitorData, error: monitorError } = await supabase
    .from('audits')
    .select('monitor_weekly')
    .eq('id', id)
    .maybeSingle()

  if (!monitorError && monitorData && typeof monitorData.monitor_weekly === 'boolean') {
    monitorWeekly = monitorData.monitor_weekly
  }

  let auditSequenceNumber = 1
  if (isOwner && userId) {
    const { data: userAudits } = await supabase
      .from('audits')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true })

    if (Array.isArray(userAudits)) {
      const idx = userAudits.findIndex((row) => row.id === typedAudit.id)
      auditSequenceNumber = idx >= 0 ? idx + 1 : 1
    }
  }

  return (
    <div className="print-shell min-h-screen bg-[#fcfcfc] dark:bg-slate-950 px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-12 xl:px-20 xl:py-20 relative transition-colors overflow-x-hidden">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12 lg:space-y-16">
        <div className="print-only print-logo-header">
          <Logo size={64} />
          <p className="text-xl font-black lowercase tracking-tight text-black break-all">{hostname}</p>
        </div>

        {isOwner && (
          <div className="print-hide">
            <EmailAuditButton
              email={currentUser?.email || ''}
              auditData={typedAudit.report_content}
              hostname={hostname}
            />
          </div>
        )}
        
        {/* --- Header & Breadcrumbs --- */}
        <header className="space-y-4">
          <div className="print-hide flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard" className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors">
              ← Back to dashboard
            </Link>
            <p className="text-[10px] text-gray-300 dark:text-gray-600 font-mono select-all break-all">id: {id}</p>
          </div>
        </header>

        {previousScores && (
          <ComparisonCard current={typedAudit} previous={previousScores} />
        )}

        {/* --- Hero Section: centered headline & scores (screenshot temporarily hidden) --- */}
        <section className="flex flex-col items-center gap-6 sm:gap-8">
          <div className="space-y-6 text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black lowercase tracking-tighter text-black dark:text-white leading-[0.95] break-words">
              {hostname}
            </h1>

            <div className="mt-4 w-full max-w-2xl mx-auto">
              <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-2xl">
                <p className="text-sm sm:text-lg lg:text-xl text-gray-500 dark:text-gray-300 leading-relaxed break-words">
                  {typedAudit.report_content?.summary || 'No summary available.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="my-6 border-gray-100 dark:border-slate-800" />

        {/* --- 📄 The Roast Report --- */}
        {/* <article className="prose prose-slate max-w-none bg-white p-8 md:p-16 rounded-[3rem] border border-gray-100 shadow-sm text-black">
          <div className="space-y-6">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                strong: ({ children }) => <strong className="text-black font-extrabold">{children}</strong>,
                h2: ({ children }) => <h2 className="text-3xl font-black text-black tracking-tight pt-4 lowercase">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-bold text-slate-800 lowercase">{children}</h3>,
                p: ({ children }) => <p className="text-lg text-slate-700 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="space-y-3 list-disc pl-5">{children}</ul>,
                li: ({ children }) => <li className="text-slate-700">{children}</li>,
              }}
            >
              {audit.report_content?.markdown}
            </ReactMarkdown>
          </div>
        </article> */}
        
        {/* --- Audit status / progress (client) --- */}
        <AuditStatus audit={typedAudit} />

        <AuditDetail
          audit={typedAudit}
          profile={profile}
          viewerIsOwner={isOwner}
          monitorWeekly={monitorWeekly}
          auditSequenceNumber={auditSequenceNumber}
          canEditChecklist={canEditChecklist}
          canComment={canComment}
          viewerEmail={currentUser.email || undefined}
          viewerUserId={currentUser.id}
          invitedDeveloperEmails={invitedDeveloperEmails}
        />
        
      </div>
    </div>
  )
}

function AuditDetail({
  audit,
  profile,
  viewerIsOwner,
  monitorWeekly,
  auditSequenceNumber,
  canEditChecklist,
  canComment,
  viewerUserId,
  viewerEmail,
  invitedDeveloperEmails,
}: {
  audit: AuditRecord,
  profile: ProfileRecord,
  viewerIsOwner: boolean,
  monitorWeekly: boolean,
  auditSequenceNumber: number,
  canEditChecklist: boolean,
  canComment: boolean,
  viewerUserId: string,
  viewerEmail?: string,
  invitedDeveloperEmails: string[],
}) {
  const isPro = profile?.plan_type === 'pro' || profile?.plan_type === 'admin'
  const isLocked = viewerIsOwner && !isPro && auditSequenceNumber === 3

  return (
    <div className="space-y-6 sm:space-y-12">
      <AuditDetailActions auditId={audit.id} websiteUrl={audit.website_url} canManage={viewerIsOwner} />

      <div className="print-hide">
        <AuditShareControls
          auditId={audit.id}
          initialIsPublic={!!audit.is_public}
          canManage={viewerIsOwner}
          allowCollaboratorComments={!!audit.allow_collaborator_comments}
        />
      </div>

      <div className="print-hide">
        <AuditDetailModals
          auditId={audit.id}
          canManageWorkflow={canEditChecklist}
          viewerUserId={viewerUserId}
          viewerEmail={viewerEmail}
          invitedDeveloperEmails={invitedDeveloperEmails}
          currentSiteUrl={audit.website_url}
          currentScores={{
            performance: audit.performance_score ?? 0,
            ux: audit.ux_score ?? 0,
            seo: audit.seo_score ?? 0,
          }}
        />
      </div>

      {viewerIsOwner && (
        <div className="print-hide">
          <WeeklyMonitoringToggle auditId={audit.id} initialEnabled={monitorWeekly} />
        </div>
      )}

      <section className="print-score-grid flex flex-col items-center gap-6 sm:gap-8">
        <div className="space-y-6 text-center">
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center">
            <ScoreCircle label="perf" score={audit.performance_score} />
            <ScoreCircle label="ux" score={audit.ux_score} />
            <ScoreCircle label="seo" score={audit.seo_score} />
          </div>
        </div>
      </section>

      {Array.isArray(audit.report_content?.third_party_tax) && audit.report_content.third_party_tax.length > 0 && (
        <section className="w-full rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Script Impact</p>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">3rd-Party Tax</h3>
            </div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-300 text-left sm:text-right break-words">
              Total Weight: ~{Math.max(0, Math.round(Number(audit.report_content.total_third_party_weight_ms || 0)))}ms FCP
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="py-2 pr-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Asset</th>
                  <th className="py-2 pr-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Category</th>
                  <th className="py-2 pr-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">FCP Impact</th>
                  <th className="py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {audit.report_content.third_party_tax.map((item, index) => (
                  <tr key={`${item.asset}-${index}`} className="border-b border-gray-100 dark:border-slate-800 last:border-b-0 align-top">
                    <td className="py-3 pr-4 text-xs sm:text-sm text-black dark:text-white break-all">{item.asset}</td>
                    <td className="py-3 pr-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 uppercase">{item.category}</td>
                    <td className="py-3 pr-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">~{Math.max(0, Math.round(Number(item.estimated_fcp_impact_ms || 0)))}ms</td>
                    <td className="py-3 text-xs sm:text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                        item.recommendation === 'remove'
                          ? 'bg-red-50 dark:bg-red-900/35 text-red-600 dark:text-red-300'
                          : 'bg-emerald-50 dark:bg-emerald-900/35 text-emerald-600 dark:text-emerald-300'
                      }`}>
                        {item.recommendation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {Array.isArray(audit.report_content?.top_heaviest_assets) && audit.report_content.top_heaviest_assets.length > 0 && (
        <section className="w-full rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-4">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Performance Diagnostics</p>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">Weight Watchers</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="py-2 pr-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Asset</th>
                  <th className="py-2 pr-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Type</th>
                  <th className="py-2 pr-4 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Impact</th>
                  <th className="py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {audit.report_content.top_heaviest_assets.map((asset, index) => (
                  <tr key={`${asset.asset}-${index}`} className="border-b border-gray-100 dark:border-slate-800 last:border-b-0 align-top">
                    <td className="py-3 pr-4 text-xs sm:text-sm text-black dark:text-white break-all">{asset.asset}</td>
                    <td className="py-3 pr-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 uppercase">{asset.type}</td>
                    <td className="py-3 pr-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">~{Math.max(0, Math.round(Number(asset.estimated_impact_ms || 0)))}ms</td>
                    <td className="py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200">{asset.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {Array.isArray(audit.report_content?.wcag_issues) && audit.report_content.wcag_issues.length > 0 && (
        <section className="w-full rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Accessibility</p>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">WCAG 2.1 Compliance</h3>
          </div>

          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/25 px-4 py-3 text-sm font-black text-red-700 dark:text-red-300">
            {audit.report_content.wcag_issues.filter((entry) => entry.severity === 'critical').length} critical issues found that could pose a legal compliance risk.
          </div>

          <AccessibilityFixAll fixes={Array.isArray(audit.report_content.accessibility_fix_all) ? audit.report_content.accessibility_fix_all : []} />

          <div className="space-y-3">
            {audit.report_content.wcag_issues.map((issue, index) => (
              <article key={`${issue.selector}-${index}`} className="rounded-2xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                    issue.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/35 text-red-600 dark:text-red-300'
                      : issue.severity === 'high'
                      ? 'bg-amber-50 dark:bg-amber-900/35 text-amber-600 dark:text-amber-300'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300'
                  }`}>
                    {issue.severity}
                  </span>
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{issue.wcag_criterion}</span>
                </div>
                <p className="text-sm font-bold text-black dark:text-white">{issue.issue}</p>
                <p className="text-xs text-gray-500 dark:text-gray-300 break-all">{issue.selector}</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{issue.fix}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className={`relative print-break-before ${isLocked ? 'max-h-[28rem] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]' : ''}`}>
        {isLocked && (
          <div className="print-hide absolute inset-0 z-10 flex flex-col items-center justify-start bg-white/60 dark:bg-slate-900/65 backdrop-blur-md rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-700 p-6 pt-8 sm:p-12 sm:pt-10 text-center">
            <LockIcon className="w-12 h-12 mb-4 text-black dark:text-white" />
            <h3 className="text-2xl text-black dark:text-white font-black tracking-tighter mb-2">Upgrade to Pro</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-8 max-w-xs">
              You&apos;ve used your 2 free audits. Subscribe to unlock the full checklist and fix your site.
            </p>
            <Link
              href="/pricing"
              className="bg-black dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all w-full max-w-xs"
            >
              Unlock All Fixes — $29/mo
            </Link>
          </div>
        )}

        <div className={isLocked ? 'filter blur-xl pointer-events-none select-none' : ''}>
          <AuditChecklist
            audit={{
              id: audit.id,
              report_content: audit.report_content ?? undefined,
              checklist_comments: audit.checklist_comments ?? undefined,
            }}
            readOnly={!canEditChecklist}
            canComment={canComment}
            viewerEmail={viewerEmail}
          />
        </div>
      </div>
    </div>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

/** * Score UI Helper 
 */
function ScoreCircle({ label, score }: { label: string, score: number }) {
  const color = score > 80 ? 'text-green-600 dark:text-green-300' : score > 50 ? 'text-amber-600 dark:text-amber-300' : 'text-rose-600 dark:text-rose-300'
  const bgColor = score > 80 ? 'bg-green-50 dark:bg-green-950/35' : score > 50 ? 'bg-amber-50 dark:bg-amber-950/35' : 'bg-rose-50 dark:bg-rose-950/35'

  return (
    <div className={`print-card ${bgColor} p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-gray-100 dark:border-slate-800 shadow-sm text-center min-w-[88px] sm:min-w-[100px] transition-transform hover:scale-105`}>
      <div className={`text-2xl sm:text-3xl font-black ${color}`}>{score || 0}</div>
      <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mt-1">{label}</div>
    </div>
  )

}

function ComparisonCard({ current, previous }: { current: AuditRecord, previous: PreviousAuditScores }) {
  const perfDelta = (current.performance_score ?? 0) - (previous?.performance_score ?? 0)
  const uxDelta = (current.ux_score ?? 0) - (previous?.ux_score ?? 0)
  const seoDelta = (current.seo_score ?? 0) - (previous?.seo_score ?? 0)

  return (
    <section className="print-card rounded-[2rem] border border-white/45 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.12)] p-5 sm:p-6 space-y-4 transition-colors">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Comparison</p>
        <h2 className="text-lg sm:text-xl font-black text-black dark:text-white tracking-tight">Latest Re-Audit Delta</h2>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <DeltaPill label="Performance" delta={perfDelta} />
        <DeltaPill label="UX" delta={uxDelta} />
        <DeltaPill label="SEO" delta={seoDelta} />
      </div>
    </section>
  )
}

function DeltaPill({ label, delta }: { label: string, delta: number }) {
  const tone = delta > 0 ? 'bg-green-50 dark:bg-green-950/35 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/70' : delta < 0 ? 'bg-red-50 dark:bg-red-950/35 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/70' : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700'
  const sign = delta > 0 ? '+' : ''

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest ${tone}`}>
      {`${sign}${delta} ${label} Score`}
    </span>
  )
}