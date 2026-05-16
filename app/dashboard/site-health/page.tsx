import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Globe2, ShieldAlert } from 'lucide-react'
import { getUserFromCookie } from '@/lib/auth'
import { getServerSupabase } from '@/utils/supabase/server'

type SiteHealthStatus = 'running' | 'not_loading' | 'security_error' | 'timeout' | 'invalid_url' | 'unknown_error' | string

type SiteHealthAuditRow = {
  id: string
  website_url: string
  created_at: string
  status: string
  site_health_status: SiteHealthStatus | null
  site_health_http_status: number | null
  site_health_latency_ms: number | null
  site_health_error: string | null
  site_health_final_url: string | null
  site_health_checked_at: string | null
}

function normalizeDomain(value: string | null | undefined) {
  return String(value || '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
}

function formatDate(value: string | null) {
  if (!value) return 'Not checked yet'
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getHealthLabel(status: SiteHealthStatus | null) {
  if (status === 'running') return 'Online'
  if (status === 'not_loading') return 'Down'
  if (status === 'security_error') return 'SSL issue'
  if (status === 'timeout') return 'Timeout'
  if (status === 'invalid_url') return 'Invalid URL'
  if (status === 'unknown_error') return 'Check failed'
  return 'Unchecked'
}

function getHealthTone(status: SiteHealthStatus | null) {
  if (status === 'running') return 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/35 dark:text-emerald-300'
  if (status === 'not_loading') return 'border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-300'
  if (status === 'security_error' || status === 'timeout') return 'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-300'
  return 'border-gray-200 bg-gray-50 text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
}

function getStatusCount(audits: SiteHealthAuditRow[], status: SiteHealthStatus) {
  return audits.filter((audit) => audit.site_health_status === status).length
}

export default async function DashboardSiteHealthPage() {
  const cookieStore = await cookies()
  const supabase = await getServerSupabase()

  let currentUser = getUserFromCookie(cookieStore)
  if (!currentUser) {
    const { data } = await supabase.auth.getUser()
    currentUser = data.user ? { id: data.user.id, email: data.user.email ?? null } : null
  }
  if (!currentUser) redirect('/signin')

  const { data } = await supabase
    .from('audits')
    .select('id,website_url,created_at,status,site_health_status,site_health_http_status,site_health_latency_ms,site_health_error,site_health_final_url,site_health_checked_at')
    .eq('user_id', currentUser.id)
    .order('site_health_checked_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(100)

  const audits = (data || []) as SiteHealthAuditRow[]
  const checkedAudits = audits.filter((audit) => audit.site_health_checked_at)
  const onlineCount = getStatusCount(audits, 'running')
  const downCount = getStatusCount(audits, 'not_loading')
  const securityCount = getStatusCount(audits, 'security_error')
  const timeoutCount = getStatusCount(audits, 'timeout')
  const averageLatency = checkedAudits.length
    ? Math.round(
        checkedAudits.reduce((sum, audit) => sum + Number(audit.site_health_latency_ms || 0), 0) / checkedAudits.length
      )
    : 0
  const latestCheckedAt = checkedAudits[0]?.site_health_checked_at || null
  const issueCount = downCount + securityCount + timeoutCount + getStatusCount(audits, 'unknown_error') + getStatusCount(audits, 'invalid_url')

  return (
    <div className="min-h-screen audo-dashboard-surface px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-5 border-b border-black/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">Nightly Monitoring</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-black sm:text-6xl">Site Health</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-gray-500 sm:text-base">
              See whether your audited sites are online, how quickly they respond, and which ones need attention.
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold text-gray-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Last run: <span className="text-black dark:text-white">{formatDate(latestCheckedAt)}</span>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <HealthMetric icon={CheckCircle2} label="Online" value={onlineCount} tone="emerald" />
          <HealthMetric icon={AlertTriangle} label="Needs attention" value={issueCount} tone={issueCount > 0 ? 'rose' : 'gray'} />
          <HealthMetric icon={ShieldAlert} label="SSL issues" value={securityCount} tone={securityCount > 0 ? 'amber' : 'gray'} />
          <HealthMetric icon={Clock3} label="Timeouts" value={timeoutCount} tone={timeoutCount > 0 ? 'amber' : 'gray'} />
          <HealthMetric icon={Activity} label="Avg latency" value={`${averageLatency}ms`} tone="blue" />
        </section>

        <section className="mt-6 rounded-[1.7rem] audo-panel border p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 border-b border-black/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">Checks</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-black">Latest site checks</h2>
            </div>
            <p className="text-xs font-bold text-gray-400">{checkedAudits.length} checked audit rows</p>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-black/10 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                <tr>
                  <th className="px-4 py-4 text-left">Site</th>
                  <th className="px-4 py-4 text-left">Health</th>
                  <th className="px-4 py-4 text-left">HTTP</th>
                  <th className="px-4 py-4 text-left">Latency</th>
                  <th className="px-4 py-4 text-left">Checked</th>
                  <th className="px-4 py-4 text-left">Signal</th>
                  <th className="px-4 py-4 text-left">Audit</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} className="border-b border-black/5 text-gray-700 hover:bg-gray-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/70">
                    <td className="min-w-[220px] px-4 py-5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                          <Globe2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-black text-black dark:text-white">{normalizeDomain(audit.website_url)}</p>
                          <p className="mt-1 max-w-[260px] truncate text-xs font-medium text-gray-400">{audit.site_health_final_url || audit.website_url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <span className={`inline-flex h-8 items-center rounded-full border px-3 text-[10px] font-black uppercase tracking-widest ${getHealthTone(audit.site_health_status)}`}>
                        {getHealthLabel(audit.site_health_status)}
                      </span>
                    </td>
                    <td className="px-4 py-5 font-bold tabular-nums">{audit.site_health_http_status ?? '-'}</td>
                    <td className="px-4 py-5 font-bold tabular-nums">{audit.site_health_latency_ms != null ? `${audit.site_health_latency_ms}ms` : '-'}</td>
                    <td className="min-w-[140px] px-4 py-5 text-gray-500 dark:text-slate-400">{formatDate(audit.site_health_checked_at)}</td>
                    <td className="min-w-[220px] px-4 py-5 text-xs font-medium text-gray-500 dark:text-slate-400">
                      {audit.site_health_error || 'No issues detected'}
                    </td>
                    <td className="px-4 py-5">
                      <Link
                        href={`/dashboard/audit/${audit.id}`}
                        className="inline-flex h-9 items-center rounded-full audo-panel border px-4 text-[10px] font-black uppercase tracking-widest text-black shadow-sm hover:bg-gray-50 dark:text-white dark:hover:bg-slate-800"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {audits.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      No site-health checks yet. Run the Databricks job once to fill this page.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function HealthMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  tone: 'emerald' | 'rose' | 'amber' | 'blue' | 'gray'
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-300 dark:border-emerald-900/60',
    rose: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/35 dark:text-rose-300 dark:border-rose-900/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/35 dark:text-amber-300 dark:border-amber-900/60',
    blue: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/35 dark:text-blue-300 dark:border-blue-900/60',
    gray: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
  }

  return (
    <div className="rounded-[1.6rem] audo-panel border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-full border ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-6 text-4xl font-black tabular-nums tracking-tight text-black dark:text-white">{value}</p>
    </div>
  )
}
