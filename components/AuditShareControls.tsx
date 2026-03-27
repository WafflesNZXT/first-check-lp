'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  auditId: string
  initialIsPublic: boolean
  canManage: boolean
}

export default function AuditShareControls({ auditId, initialIsPublic, canManage }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isSaving, setIsSaving] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [origin, setOrigin] = useState('')

  const auditPath = useMemo(() => `/${auditId}/view`, [auditId])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

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

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Share Audit</p>
          <p className="text-sm text-gray-500">{isPublic ? 'Anyone with the link can view this audit.' : 'Only you can view this audit.'}</p>
          {isPublic && origin && <p className="text-xs text-gray-400 mt-1 break-all">{`${origin}${auditPath}`}</p>}
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={handleToggleShare}
              disabled={isSaving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isPublic ? 'bg-black' : 'bg-gray-200'
              } ${isSaving ? 'opacity-60' : ''}`}
              aria-pressed={isPublic}
              aria-label="Toggle share audit"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!isPublic}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Retry Copy' : 'Copy Preview Link'}
          </button>
        </div>
      </div>
    </div>
  )
}
