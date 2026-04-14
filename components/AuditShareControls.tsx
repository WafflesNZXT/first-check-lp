'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AccessLevel = 'view' | 'edit'

type ShareRow = {
  shared_with_email: string
  access_level: AccessLevel
}

type Props = {
  auditId: string
  initialIsPublic: boolean
  canManage: boolean
  allowCollaboratorComments?: boolean
}

export default function AuditShareControls({ auditId, initialIsPublic, canManage, allowCollaboratorComments = false }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isSaving, setIsSaving] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [origin, setOrigin] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteAccessLevel, setInviteAccessLevel] = useState<AccessLevel>('view')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [inviteMessage, setInviteMessage] = useState('')
  const [shares, setShares] = useState<ShareRow[]>([])
  const [isSharesLoading, setIsSharesLoading] = useState(false)
  const [rowBusyEmail, setRowBusyEmail] = useState<string | null>(null)
  const [commentsEnabled, setCommentsEnabled] = useState(allowCollaboratorComments)
  const [isCommentsSaving, setIsCommentsSaving] = useState(false)

  const auditPath = useMemo(() => `/${auditId}/view`, [auditId])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (!canManage) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isTypingContext =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        !!target?.isContentEditable

      if (event.key === 'Escape') {
        if (isInviteOpen) {
          event.preventDefault()
          setIsInviteOpen(false)
          return
        }
        if (isManageOpen) {
          event.preventDefault()
          setIsManageOpen(false)
        }
        return
      }

      if (isTypingContext || event.ctrlKey || event.metaKey || event.altKey) return

      if (!isInviteOpen && !isManageOpen && event.key.toLowerCase() === 'i') {
        event.preventDefault()
        setInviteStatus('idle')
        setInviteMessage('')
        void loadShares()
        setIsInviteOpen(true)
        return
      }

      if (!isInviteOpen && !isManageOpen && event.key.toLowerCase() === 'm') {
        event.preventDefault()
        void loadShares()
        setIsManageOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [canManage, isInviteOpen, isManageOpen])

  const handleToggleShare = async () => {
    if (!canManage || isSaving) return

    const nextValue = !isPublic
    setIsPublic(nextValue)
    setIsSaving(true)

    const { error } = await supabase.from('audits').update({ is_public: nextValue }).eq('id', auditId)

    if (error) {
      setIsPublic(!nextValue)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
  }

  const handleCopyLink = async () => {
    if (!isPublic) return

    try {
      const fullUrl = `${origin || window.location.origin}${auditPath}`
      await navigator.clipboard.writeText(fullUrl)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1400)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 1800)
    }
  }

  const loadShares = async () => {
    if (!canManage) return
    setIsSharesLoading(true)

    const { data } = await supabase
      .from('audit_shares')
      .select('shared_with_email, access_level')
      .eq('audit_id', auditId)
      .order('shared_with_email', { ascending: true })

    const nextShares = Array.isArray(data)
      ? data
          .map((row) => ({
            shared_with_email: String((row as { shared_with_email?: string }).shared_with_email || ''),
            access_level: (String((row as { access_level?: string }).access_level || 'view').toLowerCase() === 'edit' ? 'edit' : 'view') as AccessLevel,
          }))
          .filter((row) => row.shared_with_email)
      : []

    setShares(nextShares)
    setIsSharesLoading(false)
  }

  const handleUpdateAccessLevel = async (email: string, nextAccess: AccessLevel) => {
    if (!canManage) return
    setRowBusyEmail(email)

    const { error } = await supabase
      .from('audit_shares')
      .update({ access_level: nextAccess })
      .eq('audit_id', auditId)
      .eq('shared_with_email', email)

    if (!error) {
      setShares((prev) => prev.map((row) => (row.shared_with_email === email ? { ...row, access_level: nextAccess } : row)))
    }

    setRowBusyEmail(null)
  }

  const handleRemoveAccess = async (email: string) => {
    if (!canManage) return
    setRowBusyEmail(email)

    const { error } = await supabase
      .from('audit_shares')
      .delete()
      .eq('audit_id', auditId)
      .eq('shared_with_email', email)

    if (!error) {
      setShares((prev) => prev.filter((row) => row.shared_with_email !== email))
    }

    setRowBusyEmail(null)
  }

  const handleToggleCollaboratorComments = async () => {
    if (!canManage || isCommentsSaving) return
    const nextValue = !commentsEnabled
    setCommentsEnabled(nextValue)
    setIsCommentsSaving(true)

    const { error } = await supabase
      .from('audits')
      .update({ allow_collaborator_comments: nextValue })
      .eq('id', auditId)

    if (error) {
      setCommentsEnabled(!nextValue)
    }

    setIsCommentsSaving(false)
  }

  const handleInviteDeveloper = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage || inviteStatus === 'saving') return

    const normalizedEmail = inviteEmail.trim().toLowerCase()
    if (!normalizedEmail) return

    setInviteStatus('saving')
    setInviteMessage('')

    const { error } = await supabase
      .from('audit_shares')
      .insert([{ audit_id: auditId, shared_with_email: normalizedEmail, access_level: inviteAccessLevel }])

    const lowerMessage = String(error?.message || '').toLowerCase()
    const alreadyInvited = lowerMessage.includes('duplicate') || lowerMessage.includes('unique')

    if (error && !alreadyInvited) {
      setInviteStatus('error')
      setInviteMessage('Could not send invite. Please try again.')
      return
    }

    try {
      const emailRes = await fetch('/api/invite-developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          email: normalizedEmail,
          origin: origin || (typeof window !== 'undefined' ? window.location.origin : ''),
        }),
      })

      if (!emailRes.ok) {
        setInviteStatus('error')
        setInviteMessage('Access was granted, but invite email failed to send.')
        setInviteEmail('')
        return
      }
    } catch {
      setInviteStatus('error')
      setInviteMessage('Access was granted, but invite email failed to send.')
      setInviteEmail('')
      return
    }

    setInviteStatus('success')
    setInviteMessage(alreadyInvited ? 'Developer was already invited. Email sent again.' : 'Developer invited successfully. Email sent.')
    setInviteEmail('')
    await loadShares()
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Share Audit</p>
          <p className="text-sm text-gray-500 dark:text-gray-300">{isPublic ? 'Anyone with the link can view this audit.' : 'Only you can view this audit.'}</p>
          {canManage && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Shortcuts: <span className="font-black text-black dark:text-white">I</span> Invite · <span className="font-black text-black dark:text-white">M</span> Manage · <span className="font-black text-black dark:text-white">Esc</span> Close modal</p>}
          {isPublic && origin && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 break-all">{`${origin}${auditPath}`}</p>}
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 w-full sm:w-auto">
          {canManage && (
            <button
              type="button"
              onClick={() => {
                void loadShares()
                setIsManageOpen(true)
              }}
              className="w-full sm:w-auto rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 text-center"
            >
              Manage Access
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setInviteStatus('idle')
                setInviteMessage('')
                void loadShares()
                setIsInviteOpen(true)
              }}
              className="w-full sm:w-auto rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 text-center"
            >
              Invite Developer
            </button>
          )}

          {canManage && (
            <button
              type="button"
              onClick={handleToggleShare}
              disabled={isSaving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors justify-self-center sm:justify-self-auto shrink-0 ${
                isPublic ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-slate-700'
              } ${isSaving ? 'opacity-60' : ''}`}
              aria-pressed={isPublic}
              aria-label="Toggle share audit"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 transition-transform ${
                  isPublic ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!isPublic}
            className="w-full sm:w-auto rounded-xl border border-gray-200 dark:border-slate-700 px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-center leading-tight"
          >
            {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Retry Copy' : <><span className="sm:hidden">Copy Link</span><span className="hidden sm:inline">Copy Preview Link</span></>}
          </button>
        </div>
      </div>
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="invite-developer-title">
          <div className="absolute inset-0 bg-black/55" onClick={() => setIsInviteOpen(false)} />

          <div className="relative w-full max-w-md rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">Invite Access</p>
            <h3 id="invite-developer-title" className="text-xl font-black text-black dark:text-white tracking-tight">Invite Developer</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Add an email to give this person access to this audit.</p>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">Press Esc to close</p>

            <form onSubmit={handleInviteDeveloper} className="mt-5 space-y-3">
              <input
                type="email"
                required
                placeholder="developer@company.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />

              <select
                value={inviteAccessLevel}
                onChange={(event) => setInviteAccessLevel((event.target.value === 'edit' ? 'edit' : 'view'))}
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-black dark:text-white outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="view">View only</option>
                <option value="edit">Can edit checklist</option>
              </select>

              {inviteMessage && (
                <p className={`text-xs ${inviteStatus === 'error' ? 'text-red-500' : 'text-green-600 dark:text-green-300'}`}>
                  {inviteMessage}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="inline-flex items-center rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={inviteStatus === 'saving'}
                  className="inline-flex items-center rounded-2xl bg-black dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-60"
                >
                  {inviteStatus === 'saving' ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isManageOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="manage-access-title">
          <div className="absolute inset-0 bg-black/55" onClick={() => setIsManageOpen(false)} />

          <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">Collaborator Access</p>
            <h3 id="manage-access-title" className="text-xl font-black text-black dark:text-white tracking-tight">Manage Access</h3>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">Press Esc to close</p>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Checklist Comments</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Allow collaborators to add checklist comments.</p>
              </div>
              <button
                type="button"
                onClick={handleToggleCollaboratorComments}
                disabled={isCommentsSaving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  commentsEnabled ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-slate-700'
                } ${isCommentsSaving ? 'opacity-60' : ''}`}
                aria-pressed={commentsEnabled}
                aria-label="Toggle collaborator comments"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 transition-transform ${
                    commentsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-gray-50 dark:bg-slate-800 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                <span>Email</span>
                <span>Access</span>
                <span>Action</span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
                {isSharesLoading ? (
                  <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300">Loading collaborators...</p>
                ) : shares.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-300">No invited developers yet.</p>
                ) : (
                  shares.map((row) => (
                    <div key={row.shared_with_email} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-3">
                      <p className="text-sm text-black dark:text-white break-all">{row.shared_with_email}</p>

                      <select
                        value={row.access_level}
                        onChange={(event) => void handleUpdateAccessLevel(row.shared_with_email, event.target.value === 'edit' ? 'edit' : 'view')}
                        disabled={rowBusyEmail === row.shared_with_email}
                        className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white"
                      >
                        <option value="view">View</option>
                        <option value="edit">Edit</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => void handleRemoveAccess(row.shared_with_email)}
                        disabled={rowBusyEmail === row.shared_with_email}
                        className="rounded-xl border border-red-200 dark:border-red-900/50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/35 disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageOpen(false)}
                className="inline-flex items-center rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
