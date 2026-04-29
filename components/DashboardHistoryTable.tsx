'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import RetryAuditButton from '@/components/RetryAuditButton'

type HistoryAuditRow = {
  id: string
  website_url: string
  created_at: string
  status: string
  is_public: boolean | null
  performance_score: number | null
  ux_score: number | null
  seo_score: number | null
}

type FilterKey = 'latest' | 'highest' | 'lowest'

function normalizeUrl(value: string) {
  return value.replace('https://', '').replace('http://', '')
}

function getOverallScore(audit: HistoryAuditRow) {
  const perf = Number(audit.performance_score ?? 0)
  const ux = Number(audit.ux_score ?? 0)
  const seo = Number(audit.seo_score ?? 0)
  return Math.round((perf + ux + seo) / 3)
}

function getScoreTone(score: number) {
  if (score >= 80) return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
  if (score >= 50) return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
  return 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
}

function getStatusTone(status: string) {
  if (status === 'completed') return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
  if (status === 'failed') return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
  if (status === 'processing') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
  if (status === 'cancelled') return 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300'
  return 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-300'
}

export default function DashboardHistoryTable({ audits }: { audits: HistoryAuditRow[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<FilterKey[]>([])

  const uniqueDomains = useMemo(() => {
    return Array.from(new Set(audits.map((audit) => normalizeUrl(audit.website_url)))).sort((a, b) => a.localeCompare(b))
  }, [audits])

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return uniqueDomains
      .filter((domain) => domain.toLowerCase().includes(query) && domain.toLowerCase() !== query)
      .slice(0, 5)
  }, [searchQuery, uniqueDomains])

  const filteredAudits = useMemo(() => {
    const now = new Date()
    const latestCutoff = new Date(now)
    latestCutoff.setDate(now.getDate() - 30)

    const hasLatest = selectedFilters.includes('latest')
    const hasHighest = selectedFilters.includes('highest')
    const hasLowest = selectedFilters.includes('lowest')

    let next = audits.filter((audit) => {
      const domain = normalizeUrl(audit.website_url).toLowerCase()
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch = !query || domain.includes(query)
      if (!matchesSearch) return false

      if (hasLatest) {
        const createdAt = new Date(audit.created_at)
        if (createdAt < latestCutoff) return false
      }

      return true
    })

    if (hasHighest && !hasLowest) {
      next = [...next].sort((a, b) => {
        const scoreDiff = getOverallScore(b) - getOverallScore(a)
        if (scoreDiff !== 0) return scoreDiff
        return +new Date(b.created_at) - +new Date(a.created_at)
      })
    } else if (hasLowest && !hasHighest) {
      next = [...next].sort((a, b) => {
        const scoreDiff = getOverallScore(a) - getOverallScore(b)
        if (scoreDiff !== 0) return scoreDiff
        return +new Date(b.created_at) - +new Date(a.created_at)
      })
    } else {
      next = [...next].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    }

    return next
  }, [audits, searchQuery, selectedFilters])

  const deltaByAuditId = useMemo(() => {
    const byDomain = new Map<string, HistoryAuditRow[]>()

    for (const audit of audits) {
      if (audit.status !== 'completed') continue
      const domain = normalizeUrl(audit.website_url).toLowerCase()
      const existing = byDomain.get(domain) || []
      existing.push(audit)
      byDomain.set(domain, existing)
    }

    const deltas = new Map<string, number>()
    for (const [, domainAudits] of byDomain.entries()) {
      const sorted = [...domainAudits].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      for (let index = 0; index < sorted.length - 1; index += 1) {
        const current = sorted[index]
        const previous = sorted[index + 1]
        deltas.set(current.id, getOverallScore(current) - getOverallScore(previous))
      }
    }

    return deltas
  }, [audits])

  const toggleFilter = (filter: FilterKey) => {
    setSelectedFilters((prev) => {
      if (prev.includes(filter)) return prev.filter((f) => f !== filter)
      return [...prev, filter]
    })
  }

  return (
    <section className="rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-600">History Explorer</p>
            {/* <h2 className="text-xl sm:text-2xl font-black tracking-tight text-black dark:text-white">Audit History</h2> */}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['latest', 'highest', 'lowest'] as FilterKey[]).map((filter) => {
              const active = selectedFilters.includes(filter)
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => toggleFilter(filter)}
                  className={`h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                    active
                      ? 'bg-black text-white dark:bg-white dark:text-slate-900 border-black dark:border-white'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-slate-700'
                  }`}
                >
                  {filter}
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative max-w-lg">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search domain..."
            className="w-full h-11 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />

          {suggestions.length > 0 && (
            <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-20 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setSearchQuery(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-800/70 text-gray-500 dark:text-gray-300 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="px-4 py-3 text-left">Domain</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Overall</th>
              <th className="px-4 py-3 text-left">Performance</th>
              <th className="px-4 py-3 text-left">Access</th>
              <th className="px-4 py-3 text-left">SEO</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAudits.map((audit) => {
              const domain = normalizeUrl(audit.website_url)
              const score = getOverallScore(audit)
              const status = String(audit.status || '').toLowerCase()
              const delta = deltaByAuditId.get(audit.id)
              const isCompleted = status === 'completed'

              return (
                <tr key={audit.id} className="border-t border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50/70 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-semibold text-black dark:text-white">{domain}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(audit.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center h-7 px-2.5 rounded-full border font-bold ${getScoreTone(score)}`}>
                          {score}
                        </span>
                        {typeof delta === 'number' && (
                          <span className={`inline-flex items-center h-6 px-2 rounded-full text-[10px] font-black uppercase tracking-widest ${delta > 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : delta < 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
                            {delta > 0 ? `+${delta}` : `${delta}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center h-7 px-2.5 rounded-full border font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{isCompleted ? (audit.performance_score ?? 0) : '—'}</td>
                  <td className="px-4 py-3">{isCompleted ? (audit.ux_score ?? 0) : '—'}</td>
                  <td className="px-4 py-3">{isCompleted ? (audit.seo_score ?? 0) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center h-7 px-2.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusTone(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/audit/${audit.id}`}
                        className="inline-flex items-center h-7 px-3 rounded-full border border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                      >
                        Open
                      </Link>
                      {status === 'failed' && <RetryAuditButton websiteUrl={audit.website_url} compact />}
                    </div>
                  </td>
                </tr>
              )
            })}

            {filteredAudits.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                  No audits match your current search/filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
