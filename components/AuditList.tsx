'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import RetryAuditButton from '@/components/RetryAuditButton'

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
    setAudits(initialAudits || [])
  }, [initialAudits])

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

  const recentAudits = useMemo(() => {
    return [...audits]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 3)
  }, [audits])

  const getStatusTone = (status: string) => {
    if (status === 'completed') return 'bg-green-50 text-green-600'
    if (status === 'failed') return 'bg-rose-50 text-rose-600'
    if (status === 'processing') return 'bg-amber-50 text-amber-700'
    if (status === 'cancelled') return 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'
    return 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'
  }

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
      {recentAudits.map((audit) => (
        (() => {
          const href = `/dashboard/audit/${audit.id}`
          const { completed, total } = getChecklistStats(audit)
          const isChecklistComplete = total > 0 && completed >= total
          const status = String(audit.status || '').toLowerCase()
          const isCompleted = status === 'completed'

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
              className="cursor-pointer bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 sm:p-6 lg:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col gap-4 sm:gap-6 shadow-sm hover:border-black dark:hover:border-slate-500 transition-all group"
            >
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start w-full">
              <div>
                <p className="font-sans font-bold text-base sm:text-lg lg:text-xl text-black dark:text-white lowercase tracking-tight group-hover:underline break-all">
                  {String(audit.website_url || '').replace('https://', '')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : ''}</p>
              </div>

              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-start ${getStatusTone(status)}`}>
                {status || 'unknown'}
              </span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <span className={`inline-flex items-center h-7 px-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                !isCompleted
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200'
                  : isChecklistComplete
                  ? 'bg-black text-white dark:bg-white dark:text-slate-900'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200'
              }`}>
                {!isCompleted ? 'Checklist Pending' : isChecklistComplete ? 'Checklist Complete' : `${completed}/${total || 0} Fixed`}
              </span>

              <span className={`inline-flex items-center h-7 px-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                audit.is_public ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'
              }`}>
                {audit.is_public ? 'Public Link On' : 'Private'}
              </span>
            </div>

            <div className="flex justify-end min-h-[34px]">
              {status === 'failed' ? (
                <RetryAuditButton websiteUrl={audit.website_url} />
              ) : isCompleted && audit.is_public ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyPreviewLink(audit.id)
                  }}
                  className="inline-flex items-center h-8 px-3 rounded-full border border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  {copiedAuditId === audit.id ? 'Copied!' : 'Copy Link'}
                </button>
              ) : (
                <span className="inline-flex items-center h-8 px-3 rounded-full border border-transparent text-[10px] font-black uppercase tracking-widest invisible">
                  Copy Link
                </span>
              )}
            </div>
          </div>
          )
        })()
      ))}
    </div>
  )
}