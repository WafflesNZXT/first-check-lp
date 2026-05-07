import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/lib/auth'
import DashboardHistoryTable from '@/components/DashboardHistoryTable'
import { getServerSupabase } from '@/utils/supabase/server'

type HistoryAuditRow = {
  id: string
  website_url: string
  created_at: string
  status: string
  is_public: boolean | null
  performance_score: number | null
  ux_score: number | null
  seo_score: number | null
}

export default async function DashboardHistoryPage() {
  const cookieStore = await cookies()
  const supabase = await getServerSupabase()

  let currentUser = getUserFromCookie(cookieStore)
  if (!currentUser) {
    const { data } = await supabase.auth.getUser()
    currentUser = data.user ? { id: data.user.id, email: data.user.email ?? null } : null
  }
  if (!currentUser) redirect('/signin')

  const userId = currentUser.id

  const { data } = await supabase
    .from('audits')
    .select('id, website_url, created_at, status, is_public, performance_score, ux_score, seo_score')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const audits = (data || []) as HistoryAuditRow[]

  return (
    <div className="min-h-screen audo-dashboard-surface px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:py-10">
      <div id="tutorial-history-root" className="mx-auto max-w-[1440px]">
        <header className="border-b border-black/10 pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">Audits</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-black sm:text-6xl">Audit History</h1>
          <p className="mt-3 text-sm font-medium text-gray-500 sm:text-base">Search, filter, and scan all completed audits in one place.</p>
        </header>

        <div className="mt-8">
          <DashboardHistoryTable audits={audits} />
        </div>
      </div>
    </div>
  )
}
