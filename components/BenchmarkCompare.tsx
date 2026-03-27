'use client'

import { useMemo, useState } from 'react'

type ScoreSet = {
  seo: number
  performance: number
  ux: number
}

type CompetitorPayload = {
  website_url: string
  seo_score: number
  performance_score: number
  ux_score: number
}

export default function BenchmarkCompare({
  auditId,
  currentSiteUrl,
  currentScores,
}: {
  auditId: string
  currentSiteUrl: string
  currentScores: ScoreSet
}) {
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [competitor, setCompetitor] = useState<CompetitorPayload | null>(null)

  const chartRows = useMemo(() => {
    if (!competitor) return []

    return [
      {
        label: 'SEO',
        current: currentScores.seo,
        competitor: competitor.seo_score,
      },
      {
        label: 'Performance',
        current: currentScores.performance,
        competitor: competitor.performance_score,
      },
      {
        label: 'UX',
        current: currentScores.ux,
        competitor: competitor.ux_score,
      },
    ]
  }, [competitor, currentScores])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setCompetitor(null)

    const trimmed = competitorUrl.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      const response = await fetch('/api/audit/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, competitorUrl: trimmed }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(String(payload?.error || 'Could not fetch competitor benchmark scores.'))
        return
      }

      setCompetitor(payload.competitor)
    } catch {
      setError('Could not fetch competitor benchmark scores.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5">
      <div>
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Benchmark</p>
        <h2 className="text-lg sm:text-xl font-black text-black dark:text-white tracking-tight">Current Site vs Competitor</h2>
      </div>

      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={competitorUrl}
          onChange={(event) => setCompetitorUrl(event.target.value)}
          placeholder="Competitor URL (e.g. competitor.com)"
          className="w-full h-11 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 px-4 rounded-xl bg-black dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-60"
        >
          {loading ? 'Checking...' : 'Compare'}
        </button>
      </form>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Base: <span className="font-semibold text-black dark:text-white">{currentSiteUrl}</span>
      </p>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/35 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {competitor && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Competitor: <span className="font-semibold text-black dark:text-white">{competitor.website_url}</span>
          </p>

          {chartRows.map((row) => (
            <div key={row.label} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                <span>{row.label}</span>
                <span>{row.current} / {row.competitor}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-[11px] font-semibold text-black dark:text-white mb-1">Current Site</div>
                  <div className="h-3 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-black dark:bg-white transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, row.current))}%` }} />
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Competitor</div>
                  <div className="h-3 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-gray-500 dark:bg-gray-300 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, row.competitor))}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
