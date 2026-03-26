import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserFromCookie } from '@/lib/auth'
import AuditInput from '@/components/AuditInput'
import AuditList from '@/components/AuditList' // The new client component

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  )
  
  // Try to get basic user info from the access token in cookies to avoid an extra network call
  const tokenUser = getUserFromCookie(cookieStore)
  let currentUser = tokenUser
  if (!currentUser) {
    const { data } = await supabase.auth.getUser()
    currentUser = data.user
  }
  if (!currentUser) redirect('/signin')

  const userId = currentUser?.id
  if (!userId) redirect('/signin')

  const headerStore = await headers()
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') || 'https'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : '')

  const { data: profile } = await supabase
    .from('profiles')
    .select('welcome_sent')
    .eq('id', userId)
    .single()

  if (profile && !profile.welcome_sent) {
    // Trigger the welcome email
    if (!siteUrl) throw new Error('Missing site URL for welcome email API call')
    await fetch(`${siteUrl}/api/send-welcome`, {
      method: 'POST',
      body: JSON.stringify({ email: currentUser?.email }),
    })

    // Update DB so we don't spam them every time they visit the dashboard
    await supabase
      .from('profiles')
      .update({ welcome_sent: true })
      .eq('id', userId)
  }

  

  const { data: audits } = await supabase
    .from('audits')
    .select('id, website_url, created_at, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-black tracking-tighter"><strong>audo</strong> Dashboard</h1>
          <form action="/auth/signout" method="post">
            <button className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              Sign out
            </button>
          </form>
        </header>

        <section className="mb-20 text-center">
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-black">New Audit</h2>
            <p className="text-gray-500 mb-10">Enter your URL to get ruthless feedback.</p>
          <AuditInput userId={userId} />
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Recent Audits</h3>
          {audits && audits.length > 0 ? (
            <AuditList initialAudits={audits} />
          ) : (
            <p className="text-gray-400 text-center py-10">No audits run yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}