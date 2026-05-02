"use client"

import { FormEvent, useEffect, useState } from 'react'
import { Logo } from '@/components/Logo'

type AuditRow = {
  id: string
  url: string
  status: string
  result: string
  model: string | null
  created_at: string
}

type AuditsResponse = {
  audits?: AuditRow[]
}

async function readApiPayload(response: Response): Promise<unknown> {
  const raw = await response.text()
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return { message: raw }
  }
}

const AGENT_RUNNING_RE = /^Agent running\.\.\. \d+s$/i

function toLifecycleStatus(rawStatus: string): 'Completed' | 'In Progress' | 'Error Occurred' {
  const normalized = String(rawStatus || '').trim().toLowerCase()

  if (!normalized) return 'In Progress'

  if (
    normalized === 'completed'
    || normalized === 'green'
    || normalized === 'success'
    || normalized === 'ok'
  ) {
    return 'Completed'
  }

  if (
    normalized === 'in progress'
    || normalized === 'in_progress'
    || normalized === 'processing'
    || normalized === 'running'
    || normalized === 'yellow'
  ) {
    return 'In Progress'
  }

  return 'Error Occurred'
}

function appendOrReplaceProgressLine(prev: string, nextLine: string): string {
  const line = String(nextLine || '').trim()
  if (!line) return prev

  if (!AGENT_RUNNING_RE.test(line)) {
    return `${prev}${prev ? '\n' : ''}${line}`
  }

  const lines = prev ? prev.split('\n') : []
  const existingIndex = lines.findIndex((value) => AGENT_RUNNING_RE.test(value.trim()))

  if (existingIndex >= 0) {
    lines[existingIndex] = line
    return lines.join('\n')
  }

  return `${prev}${prev ? '\n' : ''}${line}`
}

export default function DashboardMimicPage() {
  const [url, setUrl] = useState('https://useaudo.com')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestResult, setLatestResult] = useState<string>('')
  const [audits, setAudits] = useState<AuditRow[]>([])
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null)

  const selectedAudit = selectedAuditId ? audits.find((entry) => entry.id === selectedAuditId) || null : null

  async function loadAudits() {
    const response = await fetch('/api/butterbase/audits?limit=15&order=created_at.desc', {
      cache: 'no-store',
    })

    const data = (await readApiPayload(response)) as AuditsResponse | { error?: string; message?: string } | null

    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' && data.error) ||
        (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) ||
        `Failed to load audits (${response.status})`

      throw new Error(message)
    }

    setAudits(data && typeof data === 'object' && 'audits' in data && Array.isArray(data.audits) ? data.audits : [])
  }

  useEffect(() => {
    loadAudits().catch((loadError) => {
      setError(String(loadError))
    })
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setRunning(true)
    setError(null)
    setLatestResult('')

    try {
      await new Promise<void>((resolve, reject) => {
        const streamUrl = `/api/mimic-audit?url=${encodeURIComponent(url)}`
        const source = new EventSource(streamUrl)
        let finished = false

        source.addEventListener('progress', (rawEvent) => {
          const event = rawEvent as MessageEvent<string>
          try {
            const data = JSON.parse(event.data) as { message?: string }
            if (!data?.message) return
            setLatestResult((prev) => appendOrReplaceProgressLine(prev, data.message || ''))
          } catch {
            setLatestResult((prev) => appendOrReplaceProgressLine(prev, event.data))
          }
        })

        source.addEventListener('line', (rawEvent) => {
          const event = rawEvent as MessageEvent<string>
          try {
            const data = JSON.parse(event.data) as { text?: string }
            if (!data?.text) return
            setLatestResult((prev) => `${prev}${prev ? '\n' : ''}${data.text}`)
          } catch {
            setLatestResult((prev) => `${prev}${prev ? '\n' : ''}${event.data}`)
          }
        })

        source.addEventListener('done', async (rawEvent) => {
          const event = rawEvent as MessageEvent<string>
          finished = true
          source.close()
          let completionMessage = 'Audit finished.'

          try {
            const data = JSON.parse(event.data) as {
              payload?: {
                agent?: { log?: string; status?: string; errors?: unknown }
                audit?: { result?: string; log?: string; status?: string; errors?: unknown }
              }
            }
            const payload = data?.payload
            const resultText = String(payload?.agent?.log || payload?.audit?.log || payload?.audit?.result || '').trim()
            if (resultText) {
              setLatestResult((prev) => `${prev}${prev ? '\n' : ''}${resultText}`)
            }

            const status = String(payload?.agent?.status || payload?.audit?.status || '').trim()
            const lifecycleStatus = toLifecycleStatus(status)
            const rawErrors = payload?.agent?.errors ?? payload?.audit?.errors

            let errorCount = 0
            if (Array.isArray(rawErrors)) {
              errorCount = rawErrors.filter((value) => Boolean(value)).length
            } else if (
              rawErrors &&
              typeof rawErrors === 'object' &&
              'messages' in rawErrors &&
              Array.isArray((rawErrors as { messages?: unknown }).messages)
            ) {
              errorCount = ((rawErrors as { messages?: unknown[] }).messages || []).filter((value) => Boolean(value)).length
            }

            completionMessage = `Audit status: ${lifecycleStatus}.`
            if (errorCount > 0) {
              completionMessage = `${completionMessage} ${errorCount} issue${errorCount === 1 ? '' : 's'} noted.`
            }
          } catch {
            completionMessage = 'Audit finished.'
          }

          setLatestResult((prev) => `${prev}${prev ? '\n' : ''}${completionMessage}`)
          resolve()
          loadAudits().catch((loadError) => {
            setError(String(loadError))
          })
        })

        source.addEventListener('failed', (rawEvent) => {
          const event = rawEvent as MessageEvent<string>
          finished = true
          source.close()
          try {
            const data = JSON.parse(event.data) as { message?: string }
            reject(new Error(data?.message || 'Audit failed'))
          } catch {
            reject(new Error(event.data || 'Audit failed'))
          }
        })

        source.onerror = () => {
          if (finished) return
          finished = true
          source.close()
          reject(new Error('Audit stream disconnected'))
        }
      })
    } catch (submitError) {
      setError(String(submitError))
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Logo size={44} className="text-black" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard</h1>
          </div>
          <a
            href="https://useaudo.com"
            className="inline-flex w-fit items-center rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700"
          >
            Back to useaudo.com
          </a>
        </header>

        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Run AI Agent Audit</p>
          {/* <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">No-login demo runner</h2> */}
          <p className="mt-2 text-sm text-slate-600">
            Runs the browser agent audit flow and stores results in the Butterbase audits table.
          </p>

          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm outline-none ring-blue-400 focus:ring"
              required
            />
            <button
              type="submit"
              disabled={running}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {running ? 'Running audit…' : 'Run Audit'}
            </button>
          </form>

          {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          {latestResult && (
            <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-blue-100 bg-slate-50 p-4 text-xs whitespace-pre-wrap text-slate-700">
              {latestResult}
            </pre>
          )}
        </section>

        <section className="mt-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Recent Butterbase Audits</h3>
            <button
              onClick={() => loadAudits().catch((loadError) => setError(String(loadError)))}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-700"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="border-b border-slate-200 px-2 py-2">URL</th>
                  <th className="border-b border-slate-200 px-2 py-2">Status</th>
                  <th className="border-b border-slate-200 px-2 py-2">Model</th>
                  <th className="border-b border-slate-200 px-2 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr
                    key={audit.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedAuditId(audit.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedAuditId(audit.id)
                      }
                    }}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="border-b border-slate-100 px-2 py-2 text-slate-700">{audit.url}</td>
                    <td className="border-b border-slate-100 px-2 py-2 font-semibold text-slate-900">{toLifecycleStatus(audit.status)}</td>
                    <td className="border-b border-slate-100 px-2 py-2 text-slate-600">{audit.model || 'n/a'}</td>
                    <td className="border-b border-slate-100 px-2 py-2 text-slate-500">
                      {new Date(audit.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedAudit && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Selected Audit Result</p>
                <p className="text-xs text-slate-500">{new Date(selectedAudit.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedAudit.url}</p>
              <p className="mt-1 text-xs text-slate-600">
                Status: {toLifecycleStatus(selectedAudit.status)} | Model: {selectedAudit.model || 'n/a'}
              </p>
              <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-xs whitespace-pre-wrap text-slate-700">
                {selectedAudit.result || 'No result text was saved for this run.'}
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
