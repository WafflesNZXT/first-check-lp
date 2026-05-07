import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ComponentType } from 'react'
import { Activity, MousePointer2, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { getUserFromCookie } from '@/lib/auth'
import AuditInput from '@/components/AuditInput'
import AuditList from '@/components/AuditList' // The new client component
import DashboardBoot from '../../components/DashboardBoot'
import DashboardTopbar from '@/components/DashboardTopbar'
import RecentAuditsRefreshButton from '@/components/RecentAuditsRefreshButton'
import StripeCheckoutConfirm from '@/components/StripeCheckoutConfirm'
import DashboardGuidedFlow from '@/components/DashboardGuidedFlow'
import DashboardFeatureAnnouncement from '@/components/DashboardFeatureAnnouncement'
import { getServerSupabase } from '@/utils/supabase/server'

type ChecklistItem = {
  completed?: boolean
}

type AuditReportContent = {
  checklist?: ChecklistItem[]
  completed_tasks?: string[]
}

type AuditRow = {
  id: string
  website_url: string
  created_at: string
  status: string
  is_public: boolean | null
  report_content: AuditReportContent | null
  performance_score: number | null
  ux_score: number | null
  seo_score: number | null
}

function getChecklistRemaining(reportContent: AuditReportContent | null | undefined) {
  const report = reportContent || {}
  const checklist = Array.isArray(report.checklist) ? report.checklist : []
  const completedFromFlags = checklist.filter((item) => item?.completed).length
  const completedFromLegacy = Array.isArray(report.completed_tasks) ? report.completed_tasks.length : 0
  const completed = Math.max(completedFromFlags, completedFromLegacy)
  return Math.max(checklist.length - completed, 0)
}

function getAverage(values: number[]) {
  if (values.length === 0) return 0
  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total / values.length)
}

function getAuditScore(audit: AuditRow) {
  return getAverage(
    [audit.performance_score, audit.ux_score, audit.seo_score]
      .map((score) => Number(score ?? 0))
      .filter((score) => Number.isFinite(score) && score > 0)
  )
}

function getScoreDelta(audits: AuditRow[], key: 'performance_score' | 'ux_score' | 'seo_score') {
  const chronological = [...audits]
    .filter((audit) => Number.isFinite(Number(audit[key] ?? NaN)))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (chronological.length < 2) return null

  const first = Number(chronological[0][key] ?? 0)
  const latest = Number(chronological[chronological.length - 1][key] ?? 0)
  return Math.round(latest - first)
}

function formatDelta(delta: number | null) {
  if (delta === null) return 'New'
  if (delta === 0) return 'No change'
  return `${delta > 0 ? '+' : ''}${delta} trend`
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ upgraded?: string | string[]; session_id?: string | string[] }>
}) {
  const cookieStore = await cookies()
  const supabase = await getServerSupabase()
  
  let currentUser = getUserFromCookie(cookieStore)
  if (!currentUser) {
    const { data } = await supabase.auth.getUser()
    currentUser = data.user ? { id: data.user.id, email: data.user.email ?? null } : null
  }
  if (!currentUser) redirect('/signin')

  const userId = currentUser.id

  const { data: audits } = await supabase
    .from('audits')
    .select('id, website_url, created_at, status, is_public, report_content, performance_score, ux_score, seo_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('welcome_sent,full_name')
    .eq('id', userId)
    .maybeSingle()

  const typedAudits = (audits || []) as AuditRow[]
  const hasNoAudits = typedAudits.length === 0
  const hasWelcomeEmailSignalPending = profile?.welcome_sent !== true
  const shouldShowGuidedFlow = hasNoAudits || hasWelcomeEmailSignalPending
  const completedAudits = typedAudits.filter((audit) => audit.status === 'completed')
  const recentAudits = typedAudits.slice(0, 3)

  const averagePerformance = getAverage(
    completedAudits
      .map((audit) => Number(audit.performance_score ?? 0))
      .filter((score) => Number.isFinite(score))
  )

  const averageAccessibility = getAverage(
    completedAudits
      .map((audit) => Number(audit.ux_score ?? 0))
      .filter((score) => Number.isFinite(score))
  )

  const averageSeo = getAverage(
    completedAudits
      .map((audit) => Number(audit.seo_score ?? 0))
      .filter((score) => Number.isFinite(score))
  )

  const totalFixesRemaining = completedAudits.reduce((total, audit) => {
    return total + getChecklistRemaining(audit.report_content)
  }, 0)
  const trendAudits = [...completedAudits]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-8)
  const trendData = trendAudits.map((audit) => ({
    id: audit.id,
    label: new Date(audit.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    websiteUrl: audit.website_url,
    score: getAuditScore(audit),
    performance: Number(audit.performance_score ?? 0),
    accessibility: Number(audit.ux_score ?? 0),
    seo: Number(audit.seo_score ?? 0),
  }))
  const portfolioDelta = trendData.length >= 2
    ? Math.round(trendData[trendData.length - 1].score - trendData[0].score)
    : null

  const resolvedSearchParams = searchParams ? await searchParams : undefined

  const upgradedParam = resolvedSearchParams?.upgraded
  const showUpgradeBanner = Array.isArray(upgradedParam)
    ? upgradedParam.includes('1')
    : upgradedParam === '1'

  const sessionParam = resolvedSearchParams?.session_id
  const sessionId = Array.isArray(sessionParam) ? sessionParam[0] : sessionParam
  const firstName = String(profile?.full_name || currentUser.email?.split('@')[0] || '')
    .trim()
    .split(/\s+/)[0]

  return (
    <div className="min-h-screen audo-dashboard-surface px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:py-10">
      <DashboardBoot userId={userId} />
      <DashboardFeatureAnnouncement userId={userId} />
      <div className="mx-auto max-w-[1440px]">
        <StripeCheckoutConfirm sessionId={sessionId} />
        <header className="flex flex-col gap-5 border-b border-black/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-black sm:text-6xl">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-3 text-sm font-medium text-gray-500 sm:text-base">Run agent audits, watch site health, and keep fixes moving.</p>
          </div>

          <DashboardTopbar audits={typedAudits} userId={userId} email={currentUser.email ?? null} />
        </header>

        {showUpgradeBanner && (
          <section className="mt-8">
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 sm:px-6 sm:py-5">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Welcome to Pro</p>
              <h2 className="mt-1 text-lg sm:text-xl font-black tracking-tight text-emerald-900">Your Pro features are now unlocked</h2>
              <p className="mt-2 text-sm text-emerald-800">You now have access to Predict, up to 100 audits, and full dashboard workflow tools.</p>
            </div>
          </section>
        )}

        <DashboardGuidedFlow userId={userId} shouldShow={shouldShowGuidedFlow} />

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="SEO Avg" value={averageSeo} delta={formatDelta(getScoreDelta(completedAudits, 'seo_score'))} progress={averageSeo} />
          <MetricTile label="Performance" value={averagePerformance} delta={formatDelta(getScoreDelta(completedAudits, 'performance_score'))} progress={averagePerformance} />
          <MetricTile label="Accessibility" value={averageAccessibility} delta={formatDelta(getScoreDelta(completedAudits, 'ux_score'))} progress={averageAccessibility} />
          <MetricTile label="Fixes Remaining" value={totalFixesRemaining} delta={totalFixesRemaining === 0 ? 'All clear' : 'Open items'} progress={Math.max(8, Math.min(100, 100 - totalFixesRemaining * 4))} />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="rounded-[1.7rem] audo-panel border p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-black">New Audit</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Let the AI agent navigate your site like a real user.</p>
              </div>
              <span className="inline-flex h-8 items-center rounded-full border border-black/10 bg-gray-50 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Agent mode
              </span>
            </div>

            <div className="mt-6">
              <AuditInput />
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <FeatureMini icon={MousePointer2} title="Click & scroll" copy="Real interaction" />
              <FeatureMini icon={UserRoundCheck} title="Auto sign-in" copy="Test gated flows" />
              <FeatureMini icon={ShieldCheck} title="Bulk scan" copy="From sitemap.xml" />
            </div>
          </div>

          <PortfolioTrendChart data={trendData} delta={portfolioDelta} />
        </section>

        <section className="mt-5 rounded-[1.7rem] audo-panel border p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Recent Audits</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Latest runs</h2>
            </div>
            <RecentAuditsRefreshButton />
          </div>
          {recentAudits.length > 0 ? (
            <AuditList initialAudits={recentAudits} userId={userId} />
          ) : (
            <p className="py-10 text-center text-gray-400">No audits run yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function MetricTile({ label, value, delta, progress }: { label: string, value: number, delta: string, progress: number }) {
  return (
    <div className="rounded-[1.6rem] audo-panel border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">{label}</p>
        <span className="text-[10px] font-bold text-emerald-600">{delta}</span>
      </div>
      <p className="mt-5 text-4xl font-black tabular-nums tracking-tight text-black">{value}</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-black" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </div>
  )
}

function FeatureMini({ icon: Icon, title, copy }: { icon: ComponentType<{ className?: string }>; title: string; copy: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#fafafa] p-4 dark:border-slate-700 dark:bg-slate-900">
      <Icon className="h-5 w-5 text-black dark:text-blue-300" />
      <p className="mt-4 text-sm font-black text-black dark:text-white">{title}</p>
      <p className="mt-1 text-xs font-medium text-gray-500 dark:text-slate-300">{copy}</p>
    </div>
  )
}

type PortfolioTrendPoint = {
  id: string
  label: string
  websiteUrl: string
  score: number
  performance: number
  accessibility: number
  seo: number
}

function PortfolioTrendChart({ data, delta }: { data: PortfolioTrendPoint[]; delta: number | null }) {
  const width = 360
  const height = 160
  const paddingX = 16
  const paddingY = 18
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2
  const points = data.length > 0 ? data : []
  const usablePoints = points.length === 1
    ? [points[0], { ...points[0], id: `${points[0].id}-repeat` }]
    : points
  const coordinates = usablePoints.map((point, index) => {
    const x = paddingX + (index / Math.max(1, usablePoints.length - 1)) * chartWidth
    const y = paddingY + (1 - Math.max(0, Math.min(100, point.score)) / 100) * chartHeight
    return { ...point, x, y }
  })
  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = coordinates.length
    ? `${paddingX},${height - paddingY} ${linePoints} ${width - paddingX},${height - paddingY}`
    : ''
  const latest = points[points.length - 1]
  const previous = points.length > 1 ? points[points.length - 2] : null
  const trendColor = delta === null ? '#2563eb' : delta >= 0 ? '#059669' : '#dc2626'
  const trendBg = delta === null
    ? 'bg-blue-50 text-blue-700 border-blue-100'
    : delta >= 0
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : 'bg-rose-50 text-rose-700 border-rose-100'

  return (
    <div className="rounded-[1.7rem] audo-panel border p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Score Trend</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Portfolio health</h2>
          <p className="mt-2 text-xs font-medium text-gray-500">
            {latest ? `${points.length} completed audit${points.length === 1 ? '' : 's'} tracked` : 'Run audits to build your trend'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latest && (
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${trendBg}`}>
              {delta === null ? 'Baseline' : `${delta > 0 ? '+' : ''}${delta}`}
            </span>
          )}
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="mt-6 h-52 rounded-2xl bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4 dark:bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)]">
        {coordinates.length > 0 ? (
          <div className="relative h-full overflow-hidden">
            <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-gray-200 dark:border-slate-700" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-200 dark:border-slate-700" />
            <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-gray-200 dark:border-slate-700" />
            <svg viewBox={`0 0 ${width} ${height}`} className="relative h-full w-full" role="img" aria-label="Portfolio audit score trend">
              <polygon points={areaPoints} fill={trendColor} opacity="0.1" />
              <polyline points={linePoints} fill="none" stroke={trendColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              {coordinates.map((point, index) => (
                <g key={`${point.id}-${index}`}>
                  <circle cx={point.x} cy={point.y} r="5" fill="#ffffff" stroke={trendColor} strokeWidth="3" />
                  {index === coordinates.length - 1 && <circle cx={point.x} cy={point.y} r="9" fill={trendColor} opacity="0.16" />}
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
            <p className="max-w-[220px] text-sm font-bold text-gray-400">Your chart will appear after the first completed audit.</p>
          </div>
        )}
      </div>

      {latest && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-2xl border border-black/10 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="font-black uppercase tracking-widest text-gray-400">Latest</p>
            <p className="mt-2 text-2xl font-black text-black dark:text-white">{latest.score}</p>
            <p className="mt-1 truncate font-medium text-gray-500 dark:text-slate-400">{latest.label}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="font-black uppercase tracking-widest text-gray-400">Change</p>
            <p className="mt-2 text-2xl font-black" style={{ color: trendColor }}>
              {previous ? `${latest.score - previous.score > 0 ? '+' : ''}${latest.score - previous.score}` : 'New'}
            </p>
            <p className="mt-1 truncate font-medium text-gray-500 dark:text-slate-400">{previous ? 'vs previous audit' : 'baseline audit'}</p>
          </div>
        </div>
      )}
    </div>
  )
}
