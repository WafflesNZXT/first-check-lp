'use client'

import { Loader2 } from 'lucide-react'

export default function AuditLoading({
  processingNotice,
  captions = [],
  elapsedMs = 0,
}: {
  processingNotice?: string | null
  captions?: string[]
  elapsedMs?: number
}) {
  const statusMessage = processingNotice || 'Running audit analysis...'
  const timerLabel = elapsedMs > 0 ? `${(elapsedMs / 1000).toFixed(1)}s` : '0.0s'

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-slate-950">
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">Audit Progress</p>
          <p className="mt-1 text-sm font-semibold text-black dark:text-white">{statusMessage}</p>
          <p className="mt-1 font-mono text-xs font-bold tabular-nums tracking-normal text-gray-400 dark:text-slate-500">{timerLabel}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">You can stay on this page while Audo checks the site and prepares the report.</p>
        </div>
      </div>

      {captions.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
          <pre className="max-h-32 overflow-auto text-xs whitespace-pre-wrap text-gray-700 dark:text-slate-300">
            {captions.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}
