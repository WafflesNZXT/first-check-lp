import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/lib/auth'
import AuditInput from '@/components/AuditInput'
import AuditList from '@/components/AuditList' // The new client component
import DashboardBoot from '../../components/DashboardBoot'

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
    .select('id, website_url, created_at, status, is_public, report_content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 sm:p-6 lg:p-8">
      <DashboardBoot />
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-10 sm:mb-16">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tighter"><strong>audo</strong> Dashboard</h1>
          <form action="/auth/signout" method="post">
            <button className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              Sign out
            </button>
          </form>
        </header>

        <section className="mb-12 sm:mb-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 sm:mb-4 text-black">New Audit</h2>
            <p className="text-gray-500 mb-6 sm:mb-10 text-sm sm:text-base">Enter your URL to get ruthless feedback.</p>
          <AuditInput />
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Recent Audits</h3>
          {audits && audits.length > 0 ? (
            <AuditList initialAudits={audits} userId={userId} />
          ) : (
            <p className="text-gray-400 text-center py-10">No audits run yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}