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

type AuditRow = {
  id: string
  website_url: string
  created_at: string
  status: string
  is_public: boolean | null
  report_content?: AuditReportContent | null
}

function getChecklistStats(audit: AuditRow) {
  const report = (audit?.report_content || {}) as AuditReportContent
  const checklist = Array.isArray(report.checklist) ? report.checklist : []
  const completedFromFlag = checklist.filter((item) => item?.completed).length
  const completedFromLegacy = Array.isArray(report.completed_tasks) ? report.completed_tasks.length : 0
  const completed = Math.max(completedFromFlag, completedFromLegacy)
  const total = checklist.length
  return { completed, total }
}

export default function AuditList({ initialAudits, userId }: { initialAudits: AuditRow[], userId: string }) {
  const [audits, setAudits] = useState(initialAudits || [])
  const [copiedAuditId, setCopiedAuditId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const timer = window.setTimeout(() => setAudits(initialAudits || []), 0)
    return () => window.clearTimeout(timer)
  }, [initialAudits])

  useEffect(() => {
    const channel = supabase
      .channel('audit-status')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audits', filter: `user_id=eq.${userId}` }, (payload) => {
        const inserted = payload.new as AuditRow | null
        if (!inserted || inserted.status !== 'completed') return
        setAudits((prev) => {
          const exists = prev.some((a) => a.id === inserted.id)
          if (exists) return prev
          return [inserted, ...prev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audits', filter: `user_id=eq.${userId}` }, (payload) => {
        const updated = payload.new as AuditRow | null
        if (!updated) return
        setAudits((prev) => {
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
    if (status === 'completed') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300'
    if (status === 'failed') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/35 dark:text-rose-300'
    if (status === 'processing') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/35 dark:text-amber-300'
    if (status === 'cancelled') return 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
    return 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
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
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-y border-black/10 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
            <th className="px-3 py-3 text-left">Site</th>
            <th className="px-3 py-3 text-left">Status</th>
            <th className="px-3 py-3 text-left">Fixes</th>
            <th className="px-3 py-3 text-left">Share</th>
            <th className="px-3 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
      {recentAudits.map((audit) => (
        (() => {
          const href = `/dashboard/audit/${audit.id}`
          const { completed, total } = getChecklistStats(audit)
          const isChecklistComplete = total > 0 && completed >= total
          const status = String(audit.status || '').toLowerCase()
          const isCompleted = status === 'completed'

          return (
            <tr
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
              className="group cursor-pointer border-b border-black/5 text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/70"
            >
              <td className="px-3 py-4">
                <p className="font-bold lowercase tracking-tight text-black group-hover:underline dark:text-white">
                  {String(audit.website_url || '').replace('https://', '')}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : ''}</p>
              </td>
              <td className="px-3 py-4">
                <span className={`inline-flex h-7 items-center rounded-full px-3 text-[10px] font-black uppercase tracking-widest ${getStatusTone(status)}`}>
                {status || 'unknown'}
                </span>
              </td>

              <td className="px-3 py-4">
                <span className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[10px] font-black uppercase tracking-widest ${
                !isCompleted
                  ? 'bg-gray-100 text-gray-700'
                  : isChecklistComplete
                  ? 'bg-black text-white dark:bg-white dark:text-slate-950'
                  : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {!isCompleted ? 'Checklist Pending' : isChecklistComplete ? 'Checklist Complete' : `${completed}/${total || 0} Fixed`}
                </span>
              </td>

              <td className="px-3 py-4">
                <span className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[10px] font-black uppercase tracking-widest ${
                audit.is_public ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/35 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {audit.is_public ? 'Public Link On' : 'Private'}
                </span>
              </td>

              <td className="px-3 py-4 text-right">
              {status === 'failed' ? (
                <RetryAuditButton websiteUrl={audit.website_url} />
              ) : isCompleted && audit.is_public ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCopyPreviewLink(audit.id)
                  }}
                  className="inline-flex h-8 items-center rounded-full border border-black/10 px-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-white dark:border-slate-700 dark:text-white dark:hover:bg-slate-900"
                >
                  {copiedAuditId === audit.id ? 'Copied!' : 'Copy Link'}
                </button>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">View</span>
              )}
              </td>
          </tr>
          )
        })()
      ))}
        </tbody>
      </table>
    </div>
  )
}
