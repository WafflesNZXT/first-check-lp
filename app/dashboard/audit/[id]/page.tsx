import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AuditChecklist from '../../../../components/AuditChecklist'
import AuditStatus from '../../../../components/AuditStatus'
import EmailAuditButton from '../../../../components/EmailAuditButton'
import AuditShareControls from '../../../../components/AuditShareControls'
import AuditDetailActions from '../../../../components/AuditDetailActions'
import BenchmarkCompare from '../../../../components/BenchmarkCompare'
import WeeklyMonitoringToggle from '../../../../components/WeeklyMonitoringToggle'
import { Logo } from '../../../../components/Logo'
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
}

type ProfileRecord = {
  subscription_status: string | null
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
    .select('id, user_id, is_public, website_url, report_content, performance_score, ux_score, seo_score, status, created_at, screenshot_url')
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
  if (!currentUser) redirect('/signin')

  const userId = currentUser.id
  const isOwner = userId === typedAudit.user_id
  if (!isOwner) redirect('/dashboard')

  let profile: ProfileRecord = null
  if (isOwner && userId) {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_status, audit_count')
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

  return (
    <div className="print-shell min-h-screen bg-[#fcfcfc] dark:bg-slate-950 p-4 sm:p-6 lg:p-12 xl:p-24 relative transition-colors">
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12 lg:space-y-16">
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black lowercase tracking-tighter text-black dark:text-white leading-[0.95] break-words">
              {hostname}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto px-1 sm:px-0 break-words">
              {typedAudit.report_content?.summary || "no summary available."}
            </p>
          </div>
        </section>

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

        <AuditDetail audit={typedAudit} profile={profile} viewerIsOwner={isOwner} monitorWeekly={monitorWeekly} />
        
      </div>
    </div>
  )
}

function AuditDetail({ audit, profile, viewerIsOwner, monitorWeekly }: { audit: AuditRecord, profile: ProfileRecord, viewerIsOwner: boolean, monitorWeekly: boolean }) {
  const isPro = profile?.subscription_status === 'active'
  const isFreeAudit = (profile?.audit_count ?? 0) <= 2
  const isLocked = viewerIsOwner && !isPro && !isFreeAudit

  return (
    <div className="space-y-8 sm:space-y-12">
      <AuditDetailActions websiteUrl={audit.website_url} />

      <div className="print-hide">
        <AuditShareControls
          auditId={audit.id}
          initialIsPublic={!!audit.is_public}
          canManage={viewerIsOwner}
        />
      </div>

      <div className="print-hide">
        <WeeklyMonitoringToggle auditId={audit.id} initialEnabled={monitorWeekly} />
      </div>

      <section className="print-score-grid flex flex-col items-center gap-6 sm:gap-8">
        <div className="space-y-6 text-center">
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center">
            <ScoreCircle label="perf" score={audit.performance_score} />
            <ScoreCircle label="ux" score={audit.ux_score} />
            <ScoreCircle label="seo" score={audit.seo_score} />
          </div>
        </div>
      </section>

      <div className="print-hide">
        <BenchmarkCompare
          auditId={audit.id}
          currentSiteUrl={audit.website_url}
          currentScores={{
            performance: audit.performance_score ?? 0,
            ux: audit.ux_score ?? 0,
            seo: audit.seo_score ?? 0,
          }}
        />
      </div>

      <div className="relative print-break-before">
        {isLocked && (
          <div className="print-hide absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/65 backdrop-blur-md rounded-[2rem] sm:rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-slate-700 p-6 sm:p-12 text-center">
            <LockIcon className="w-12 h-12 mb-4 text-black dark:text-white" />
            <h3 className="text-2xl text-black dark:text-white font-black tracking-tighter mb-2">Upgrade to Pro</h3>
            <p className="text-gray-500 dark:text-gray-300 mb-8 max-w-xs">
              You&apos;ve used your 2 free audits. Subscribe to unlock the full checklist and fix your site.
            </p>
            <Link
              href="/pricing"
              className="bg-black dark:bg-white text-white dark:text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all w-full max-w-xs"
            >
              Unlock All Fixes — $12/mo
            </Link>
          </div>
        )}

        <div className={isLocked ? 'filter blur-xl pointer-events-none select-none' : ''}>
          <AuditChecklist audit={{ id: audit.id, report_content: audit.report_content ?? undefined }} />
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