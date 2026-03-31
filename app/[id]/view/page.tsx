import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AuditChecklist from '@/components/AuditChecklist'
import AuditStatus from '@/components/AuditStatus'

type ChecklistItem = {
  issue: string
  fix: string
  selector?: string
  code_example?: string
  category: string
  priority?: string
  completed?: boolean
}

type AuditRecord = {
  id: string
  is_public: boolean | null
  website_url: string
  report_content: {
    summary?: string
    checklist?: ChecklistItem[]
    completed_tasks?: string[]
  } | null
  performance_score: number
  ux_score: number
  seo_score: number
  status: string
}

export default async function PublicAuditViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: audit, error } = await supabase
    .from('audits')
    .select('id, is_public, website_url, report_content, performance_score, ux_score, seo_score, status')
    .eq('id', id)
    .single()

  if (error || !audit) notFound()

  const typedAudit = audit as AuditRecord

  if (!typedAudit.is_public) notFound()

  let hostname = 'shared audit'
  try {
    const urlToParse = typedAudit.website_url.startsWith('http')
      ? typedAudit.website_url
      : `https://${typedAudit.website_url}`
    hostname = new URL(urlToParse).hostname
  } catch {
    hostname = typedAudit.website_url
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] p-4 sm:p-6 lg:p-12 xl:p-24 relative">
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12 lg:space-y-16">
        <header className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              ← Home
            </Link>
            <p className="text-[10px] text-gray-300 font-mono select-all">shared preview</p>
          </div>
        </header>

        <section className="flex flex-col items-center gap-6 sm:gap-8">
          <div className="space-y-6 text-center w-full">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black lowercase tracking-tighter text-black leading-[0.95] break-words">{hostname}</h1>

            <div className="mt-4 w-full max-w-2xl mx-auto">
              <div className="bg-gray-50 dark:bg-slate-900 p-6 rounded-2xl">
                <p className="text-base sm:text-lg lg:text-xl text-gray-700 dark:text-gray-200 leading-relaxed break-words">
                  {typedAudit.report_content?.summary || 'No summary available.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="my-6 border-gray-200 dark:border-slate-800" />

        <AuditStatus audit={typedAudit} />

        <hr className="my-6 border-gray-200 dark:border-slate-800" />

        <section className="flex flex-col items-center gap-6 sm:gap-8">
          <div className="space-y-6 text-center">
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4 justify-center">
              <ScoreCircle label="perf" score={typedAudit.performance_score} />
              <ScoreCircle label="ux" score={typedAudit.ux_score} />
              <ScoreCircle label="seo" score={typedAudit.seo_score} />
            </div>
          </div>
        </section>

        <hr className="my-6 border-gray-200 dark:border-slate-800" />

        <AuditChecklist audit={{ id: typedAudit.id, report_content: typedAudit.report_content ?? undefined }} readOnly />
      </div>
    </div>
  )
}

function ScoreCircle({ label, score }: { label: string, score: number }) {
  const color = score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500'
  const bgColor = score > 80 ? 'bg-green-50' : score > 50 ? 'bg-yellow-50' : 'bg-red-50'

  return (
    <div className={`${bgColor} p-4 sm:p-5 rounded-[1.25rem] sm:rounded-[1.5rem] border border-gray-100 shadow-sm text-center min-w-[88px] sm:min-w-[100px] transition-transform`}>
      <div className={`text-2xl sm:text-3xl font-black ${color}`}>{score || 0}</div>
      <div className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">{label}</div>
    </div>
  )
}
