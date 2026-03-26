import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import AuditChecklist from '../../../../components/AuditChecklist'
import AuditStatus from '../../../../components/AuditStatus'

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

  if (!audit) return <div>Audit not found — no row for id {id}</div>

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-8 md:p-24">
      <div className="max-w-5xl mx-auto space-y-16">
        
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

            <div className="flex gap-4 pt-4 justify-center">
              <ScoreCircle label="perf" score={audit.performance_score} />
              <ScoreCircle label="ux" score={audit.ux_score} />
              <ScoreCircle label="seo" score={audit.seo_score} />
            </div>
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

        {/* --- ✅ Improvement Roadmap (client) --- */}
        <AuditChecklist audit={audit} />
        
      </div>
    </div>
  )
}

/** * Score UI Helper 
 */
function ScoreCircle({ label, score }: { label: string, score: number }) {
  const color = score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500'
  const bgColor = score > 80 ? 'bg-green-50' : score > 50 ? 'bg-yellow-50' : 'bg-red-50'

  return (
    <div className={`bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm text-center min-w-[100px] transition-transform hover:scale-105`}>
      <div className={`text-3xl font-black ${color}`}>{score || 0}</div>
      <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">{label}</div>
    </div>
  )

}