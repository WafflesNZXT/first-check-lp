'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type ChecklistItem = {
  issue?: string
  completed?: boolean
}

type AuditReportContent = {
  checklist?: ChecklistItem[]
  completed_tasks?: string[]
}

function getChecklistStats(audit: any) {
  const report = (audit?.report_content || {}) as AuditReportContent
  const checklist = Array.isArray(report.checklist) ? report.checklist : []
  const completedFromFlag = checklist.filter((item) => item?.completed).length
  const completedFromLegacy = Array.isArray(report.completed_tasks) ? report.completed_tasks.length : 0
  const completed = Math.max(completedFromFlag, completedFromLegacy)
  const total = checklist.length
  return { completed, total }
}

export default function AuditList({ initialAudits, userId }: { initialAudits: any[], userId: string }) {
  const [audits, setAudits] = useState(initialAudits || [])
  const [copiedAuditId, setCopiedAuditId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel('audit-status')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audits', filter: `user_id=eq.${userId}` }, (payload) => {
        const inserted = (payload as any)?.new
        if (!inserted || inserted.status !== 'completed') return
        setAudits((prev: any[]) => {
          const exists = prev.some((a) => a.id === inserted.id)
          if (exists) return prev
          return [inserted, ...prev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audits', filter: `user_id=eq.${userId}` }, (payload) => {
        const updated = (payload as any)?.new
        if (!updated) return
        setAudits((prev: any[]) => {
          const exists = prev.some((a) => a.id === updated.id)
          if (!exists) {
            if (updated.status !== 'completed') return prev
            return [updated, ...prev]
          }

          const next = prev
            .map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
            .filter((a) => a.status === 'completed')

          return next
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const completedAudits = useMemo(() => {
    return audits.filter((audit) => audit.status === 'completed')
  }, [audits])

  const handleCopyPreviewLink = async (auditId: string) => {
    try {
      const fullUrl = `${window.location.origin}/${auditId}/view`
      await navigator.clipboard.writeText(fullUrl)
      setCopiedAuditId(auditId)
      window.setTimeout(() => setCopiedAuditId(null), 1400)
    } catch {
      setCopiedAuditId(null)
    }
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      {completedAudits.map((audit) => (
        (() => {
          const href = `/dashboard/audit/${audit.id}`
          const { completed, total } = getChecklistStats(audit)
          const isChecklistComplete = total > 0 && completed >= total
          const remaining = Math.max(total - completed, 0)

          return (
            <div
              key={audit.id}
              role="link"
              tabIndex={0}
              onMouseEnter={() => router.prefetch(href)}
              onTouchStart={() => router.prefetch(href)}
              onFocus={() => router.prefetch(href)}
              onClick={() => router.push(href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push(href)
                }
              }}
              className="cursor-pointer bg-white border border-gray-100 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col gap-4 sm:gap-6 shadow-sm hover:border-black transition-all group"
            >
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start w-full">
              <div>
                <p className="font-bold text-base sm:text-lg lg:text-xl text-black lowercase tracking-tight group-hover:underline break-all">
                  {String(audit.website_url || '').replace('https://', '')}
                </p>
                <p className="text-xs text-gray-400">{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : ''}</p>
              </div>

              <span className="px-4 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest self-start">
                completed
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                isChecklistComplete ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {isChecklistComplete ? 'Checklist Complete' : `${completed}/${total || 0} Fixed`}
              </span>

              {!isChecklistComplete && total > 0 && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border border-gray-200 text-gray-500">
                  {remaining} Remaining
                </span>
              )}

              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                audit.is_public ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {audit.is_public ? 'Public Link On' : 'Private'}
              </span>
            </div>

            {audit.is_public && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyPreviewLink(audit.id)
                  }}
                  className="px-3 py-1.5 rounded-full border border-gray-200 text-[10px] font-black uppercase tracking-widest text-black hover:bg-gray-50"
                >
                  {copiedAuditId === audit.id ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            )}
          </div>
          )
        })()
      ))}
    </div>
  )
}