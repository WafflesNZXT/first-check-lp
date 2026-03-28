'use client'

import { useState } from 'react'

type PredictResponse = {
  predicted_seo_score: number
  predicted_readability_score: number
  predicted_score: number
  current_score: number
  summary: string
  red_flags: string[]
}

function ScoreGauge({ label, score, tone }: { label: string, score: number, tone: 'dark' | 'violet' }) {
  const progress = Math.max(0, Math.min(100, Math.round(score || 0)))
  const barTone = tone === 'dark' ? 'bg-black dark:bg-white' : 'bg-violet-600 dark:bg-violet-300'

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl sm:text-4xl font-black text-black dark:text-white tabular-nums">{progress}</p>
      <div className="mt-3 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full ${barTone}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function PredictPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PredictResponse | null>(null)

  const runPrediction = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content.trim() || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(String(payload?.error || 'Prediction failed'))
      }

      setResult(payload as PredictResponse)
    } catch (err: any) {
      setError(String(err?.message || 'Prediction failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">SEO Forecast</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">Predict Content Performance</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300">Paste new copy or HTML to estimate SEO and readability against an 85/100 benchmark.</p>
        </header>

        <form onSubmit={runPrediction} className="space-y-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste draft copy or HTML here..."
            className="w-full min-h-[220px] sm:min-h-[280px] rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="rounded-2xl bg-black dark:bg-white text-white dark:text-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-60"
            >
              {loading ? 'Predicting...' : 'Run Prediction'}
            </button>
          </div>
        </form>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {result && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <ScoreGauge label="Predicted Score" score={result.predicted_score} tone="dark" />
              <ScoreGauge label="Current Score" score={result.current_score} tone="violet" />
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-3">
              <h2 className="text-lg font-black text-black dark:text-white tracking-tight">Model Notes</h2>
              <p className="text-sm text-gray-700 dark:text-gray-200">{result.summary}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  SEO: {result.predicted_seo_score}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  Readability: {result.predicted_readability_score}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-3">
              <h3 className="text-base font-black text-black dark:text-white tracking-tight">Red Flags</h3>
              {result.red_flags.length > 0 ? (
                <ul className="space-y-2">
                  {result.red_flags.map((flag, index) => (
                    <li key={`${flag}-${index}`} className="text-sm text-gray-700 dark:text-gray-200">• {flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">No major red flags detected.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
