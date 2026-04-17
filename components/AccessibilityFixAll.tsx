'use client'

import { useMemo, useState } from 'react'

type AccessibilityFix = {
  selector: string
  aria_label?: string
  alt_text?: string
}

export default function AccessibilityFixAll({ fixes }: { fixes: AccessibilityFix[] }) {
  const [open, setOpen] = useState(false)

  const normalized = useMemo(() => {
    return (Array.isArray(fixes) ? fixes : [])
      .map((item) => ({
        selector: String(item.selector || '').trim(),
        aria_label: item.aria_label ? String(item.aria_label).trim() : '',
        alt_text: item.alt_text ? String(item.alt_text).trim() : '',
      }))
      .filter((item) => item.selector)
  }, [fixes])

  if (normalized.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          One-click accessibility metadata suggestions for all failing elements.
        </p>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex items-center rounded-xl bg-black dark:bg-white text-white dark:text-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          {open ? 'Hide Fix All' : 'Fix All'}
        </button>
      </div>

      {open && (
        <>
          <div className="space-y-2 sm:hidden">
            {normalized.map((item) => (
              <article key={`fix-mobile-${item.selector}-${item.aria_label}-${item.alt_text}`} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Selector</p>
                  <p className="mt-1 text-xs text-black dark:text-white break-all">{item.selector}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">ARIA Label</p>
                  <p className="mt-1 text-xs text-gray-700 dark:text-gray-200 break-words">{item.aria_label || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Alt Text</p>
                  <p className="mt-1 text-xs text-gray-700 dark:text-gray-200 break-words">{item.alt_text || '—'}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
            <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Selector</th>
                <th className="py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">ARIA Label</th>
                <th className="py-2 px-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Alt Text</th>
              </tr>
            </thead>
            <tbody>
              {normalized.map((item) => (
                <tr key={`${item.selector}-${item.aria_label}-${item.alt_text}`} className="border-b border-gray-100 dark:border-slate-800 last:border-b-0 align-top">
                  <td className="py-2.5 px-3 text-xs sm:text-sm text-black dark:text-white break-all">{item.selector}</td>
                  <td className="py-2.5 px-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200">{item.aria_label || '—'}</td>
                  <td className="py-2.5 px-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200">{item.alt_text || '—'}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
