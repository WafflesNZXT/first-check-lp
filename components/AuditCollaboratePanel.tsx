'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import AuditShareControls from '@/components/AuditShareControls'
import AuditDetailModals from '@/components/AuditDetailModals'
import WeeklyMonitoringToggle from '@/components/WeeklyMonitoringToggle'

type Props = {
  auditId: string
  initialIsPublic: boolean
  canManageShare: boolean
  allowCollaboratorComments: boolean
  collaborationLocked: boolean
  canManageWorkflow: boolean
  viewerUserId: string
  viewerEmail?: string
  invitedDeveloperEmails: string[]
  currentSiteUrl: string
  currentScores: {
    performance: number
    ux: number
    seo: number
  }
  viewerIsOwner: boolean
  monitorWeekly: boolean
}

export default function AuditCollaboratePanel({
  auditId,
  initialIsPublic,
  canManageShare,
  allowCollaboratorComments,
  collaborationLocked,
  canManageWorkflow,
  viewerUserId,
  viewerEmail,
  invitedDeveloperEmails,
  currentSiteUrl,
  currentScores,
  viewerIsOwner,
  monitorWeekly,
}: Props) {
  const [open, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
      >
        Collaborate
      </button>

      {open && isMounted && createPortal(
        <div className="fixed inset-0 z-[9998] flex items-start justify-center px-3 py-6 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="collaborate-title">
          <button type="button" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/55" aria-label="Close collaborate" />

          <div className="relative z-[9999] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200 dark:border-slate-700 bg-[#fcfcfc] dark:bg-slate-950 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Team</p>
                <h3 id="collaborate-title" className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">Collaborate</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <AuditShareControls
              auditId={auditId}
              initialIsPublic={initialIsPublic}
              canManage={canManageShare}
              allowCollaboratorComments={allowCollaboratorComments}
              collaborationLocked={collaborationLocked}
            />

            <AuditDetailModals
              auditId={auditId}
              canManageWorkflow={canManageWorkflow}
              collaborationLocked={collaborationLocked}
              viewerUserId={viewerUserId}
              viewerEmail={viewerEmail}
              invitedDeveloperEmails={invitedDeveloperEmails}
              currentSiteUrl={currentSiteUrl}
              currentScores={currentScores}
            />

            {viewerIsOwner && <WeeklyMonitoringToggle auditId={auditId} initialEnabled={monitorWeekly} />}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
