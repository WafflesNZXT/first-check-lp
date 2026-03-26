import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AuditChecklist from '../../../../components/AuditChecklist'
import AuditStatus from '../../../../components/AuditStatus'
import EmailAuditButton from '../../../../components/EmailAuditButton'
import { getUserFromCookie } from '@/lib/auth'

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
        },
        set(name, value) {
          // cookieStore.set expects an object; attempt to call if available
          try { (cookieStore as any).set?.({ name, value }) } catch (e) { /* no-op */ }
        },
        remove(name) {
          try { (cookieStore as any).delete?.(name) } catch (e) { /* no-op */ }
        }
      }
    }
  )

  const { data: audit, error } = await supabase
    .from('audits')
    .select('id, website_url, report_content, performance_score, ux_score, seo_score, status, created_at, screenshot_url')
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

  if (!audit) return <div>Audit not found — no row for id {id}</div>

  let hostname = "unknown site";
    try {
    // Add https prefix if the user forgot it, so URL() doesn't get confused
    const urlToParse = audit.website_url.startsWith('http') 
        ? audit.website_url 
        : `https://${audit.website_url}`;
    hostname = new URL(urlToParse).hostname;
    } catch (e) {
    hostname = audit.website_url; // Fallback to raw input
    }

  // Try to get user from access token cookie to avoid an extra network call
  const tokenUser = getUserFromCookie(cookieStore)
  let currentUser = tokenUser
  if (!currentUser) {
    const { data } = await supabase.auth.getUser()
    currentUser = data.user
  }
  if (!currentUser) redirect('/signin')

  const userId = currentUser?.id
  if (!userId) redirect('/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, audit_count')
    .eq('id', userId)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-8 md:p-24 relative">
      <div className="max-w-5xl mx-auto space-y-16">
        <EmailAuditButton
          email={currentUser?.email || ''}
          auditData={audit.report_content}
          hostname={hostname}
        />
        
        {/* --- Header & Breadcrumbs --- */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              ← Back to dashboard
            </Link>
            <p className="text-[10px] text-gray-300 font-mono select-all">id: {id}</p>
          </div>
        </header>

        {/* --- Hero Section: centered headline & scores (screenshot temporarily hidden) --- */}
        <section className="flex flex-col items-center gap-8">
          <div className="space-y-6 text-center">
            <h1 className="text-6xl font-black lowercase tracking-tighter text-black leading-none">
              {hostname}
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
              {audit.report_content?.summary || "no summary available."}
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
        <AuditStatus audit={audit} />

        <AuditDetail audit={audit} profile={profile} />
        
      </div>
    </div>
  )
}

function AuditDetail({ audit, profile }: { audit: any, profile: any }) {
  const isPro = profile?.subscription_status === 'active'
  const isFreeAudit = (profile?.audit_count ?? 0) <= 2
  const isLocked = !isPro && !isFreeAudit

  return (
    <div className="space-y-12">
      <section className="flex flex-col items-center gap-8">
        <div className="space-y-6 text-center">
          <div className="flex gap-4 pt-4 justify-center">
            <ScoreCircle label="perf" score={audit.performance_score} />
            <ScoreCircle label="ux" score={audit.ux_score} />
            <ScoreCircle label="seo" score={audit.seo_score} />
          </div>
        </div>
      </section>

      <div className="relative">
        {isLocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-gray-200 p-12 text-center">
            <LockIcon className="w-12 h-12 mb-4 text-black" />
            <h3 className="text-2xl text-black font-black tracking-tighter mb-2">Upgrade to Pro</h3>
            <p className="text-gray-500 mb-8 max-w-xs">
              You've used your 2 free audits. Subscribe to unlock the full checklist and fix your site.
            </p>
            <Link
              href="/pricing"
              className="bg-black text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all"
            >
              Unlock All Fixes — $12/mo
            </Link>
          </div>
        )}

        <div className={isLocked ? 'filter blur-xl pointer-events-none select-none' : ''}>
          <AuditChecklist audit={audit} />
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
  const color = score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500'
  const bgColor = score > 80 ? 'bg-green-50' : score > 50 ? 'bg-yellow-50' : 'bg-red-50'

  return (
    <div className={`${bgColor} p-5 rounded-[1.5rem] border border-gray-100 shadow-sm text-center min-w-[100px] transition-transform hover:scale-105`}>
      <div className={`text-3xl font-black ${color}`}>{score || 0}</div>
      <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">{label}</div>
    </div>
  )

}