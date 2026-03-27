'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function WeeklyMonitoringToggle({ auditId, initialEnabled }: { auditId: string, initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const onToggle = async () => {
    if (saving) return

    const nextValue = !enabled
    setEnabled(nextValue)
    setSaving(true)
    setSaveError(null)

    const { error } = await supabase
      .from('audits')
      .update({ monitor_weekly: nextValue })
      .eq('id', auditId)

    if (error) {
      setEnabled(!nextValue)
      setSaveError('Could not update weekly monitoring. Please run the SQL migration first.')
    }

    setSaving(false)
  }

  return (
    <section className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Monitoring</p>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-semibold">Enable Weekly Monitoring</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            When enabled, this audit is marked for a re-audit every 7 days. You will receive an email only if your score drops.
          </p>
          {saveError && <p className="text-xs text-red-600 dark:text-red-300 mt-2">{saveError}</p>}
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={saving}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            enabled ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-slate-700'
          } ${saving ? 'opacity-60' : ''}`}
          aria-pressed={enabled}
          aria-label="Toggle weekly monitoring"
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 transition-transform ${
              enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </section>
  )
}
