import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/lib/auth'
import DashboardHistoryTable from '@/components/DashboardHistoryTable'

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

  const { data } = await supabase
    .from('audits')
    .select('id, website_url, created_at, status, is_public, performance_score, ux_score, seo_score')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  const audits = (data || []) as HistoryAuditRow[]

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 sm:mb-10">
          <h1 className="font-sans text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tighter">Audit History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Search, filter, and scan all completed audits in one place.</p>
        </header>

        <DashboardHistoryTable audits={audits} />
      </div>
    </div>
  )
}
