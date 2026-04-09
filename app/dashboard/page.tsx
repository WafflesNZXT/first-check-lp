import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/lib/auth'
import { Logo } from '@/components/Logo'
import AuditInput from '@/components/AuditInput'
import AuditList from '@/components/AuditList' // The new client component
import DashboardBoot from '../../components/DashboardBoot'
import RecentAuditsRefreshButton from '@/components/RecentAuditsRefreshButton'
import DashboardHeaderActions from '@/components/DashboardHeaderActions'

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

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  )
  
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

  const typedAudits = (audits || []) as AuditRow[]
  const completedAudits = typedAudits.filter((audit) => audit.status === 'completed')
  const recentCompletedAudits = completedAudits.slice(0, 3)

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

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <DashboardBoot />
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-10 sm:mb-16">
          <div className="flex items-center gap-2">
            <Logo size={48} className="text-black dark:text-white" />
            <h1 className="font-sans text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tighter">Dashboard</h1>
          </div>
          <DashboardHeaderActions />
        </header>

        <section className="mb-10 sm:mb-14">
          <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col gap-2 mb-5 sm:mb-6">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-400">Global Health</p>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">Portfolio Snapshot</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricTile label="SEO Avg" value={averageSeo} tone="violet" />
              <MetricTile label="Performance Avg" value={averagePerformance} tone="blue" />
              <MetricTile label="Accessibility Avg" value={averageAccessibility} tone="emerald" />
              <MetricTile label="Total Fixes Remaining" value={totalFixesRemaining} tone="amber" />
            </div>
          </div>
        </section>

        <section className="mb-12 sm:mb-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-black dark:text-white">New Audit</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 sm:mb-10 text-sm sm:text-base">Enter your URL to get ruthless feedback.</p>
          <AuditInput />
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Recent Audits</h3>
            <RecentAuditsRefreshButton />
          </div>
          {recentCompletedAudits.length > 0 ? (
            <AuditList initialAudits={recentCompletedAudits} userId={userId} />
          ) : (
            <p className="text-gray-400 text-center py-10">No audits run yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function MetricTile({ label, value, tone }: { label: string, value: number, tone: 'blue' | 'violet' | 'emerald' | 'amber' }) {
  const toneClasses = {
    blue: {
      card: 'border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/35',
      label: 'text-blue-700 dark:text-blue-300',
      value: 'text-blue-900 dark:text-blue-100',
    },
    violet: {
      card: 'border-violet-100 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/35',
      label: 'text-violet-700 dark:text-violet-300',
      value: 'text-violet-900 dark:text-violet-100',
    },
    emerald: {
      card: 'border-emerald-100 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/35',
      label: 'text-emerald-700 dark:text-emerald-300',
      value: 'text-emerald-900 dark:text-emerald-100',
    },
    amber: {
      card: 'border-amber-100 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/35',
      label: 'text-amber-700 dark:text-amber-300',
      value: 'text-amber-900 dark:text-amber-100',
    },
  } as const

  const palette = toneClasses[tone]

  return (
    <div className={`rounded-2xl border px-3.5 py-3.5 sm:px-4 sm:py-4 ${palette.card}`}>
      <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.14em] ${palette.label}`}>{label}</p>
      <p className={`mt-1 text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${palette.value}`}>{value}</p>
    </div>
  )
}