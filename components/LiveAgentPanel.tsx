'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, CheckCircle2, Code2, MousePointer2, Play, Radar, ScrollText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AgentSession = {
  id: string
  audit_id: string
  user_id: string
  target_url: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  mode: string
  current_url: string | null
  summary: string | null
  error_message: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  updated_at: string
}

type AgentEvent = {
  id: number
  session_id: string
  audit_id: string
  user_id: string
  event_type: 'status' | 'navigate' | 'scroll' | 'click' | 'input' | 'finding' | 'screenshot' | 'code_scan' | 'complete' | 'error'
  message: string
  current_url: string | null
  cursor_x: number | null
  cursor_y: number | null
  scroll_y: number | null
  screenshot_url: string | null
  severity: 'low' | 'medium' | 'high' | 'critical' | null
  metadata: Record<string, unknown>
  created_at: string
}

type Props = {
  auditId: string
  targetUrl: string
  canManage: boolean
}

const PREVIEW_EVENTS: Array<{
  eventType: AgentEvent['event_type']
  message: string
  cursorX: number
  cursorY: number
  scrollY: number
  severity?: AgentEvent['severity']
}> = [
  { eventType: 'navigate', message: 'Opened homepage and waited for the first paint.', cursorX: 12, cursorY: 14, scrollY: 0 },
  { eventType: 'scroll', message: 'Scrolled through the hero and primary CTA area.', cursorX: 68, cursorY: 32, scrollY: 18 },
  { eventType: 'click', message: 'Clicked the primary CTA to inspect destination clarity.', cursorX: 72, cursorY: 42, scrollY: 26 },
  { eventType: 'finding', message: 'Found a trust gap: the first screen needs sharper proof near the CTA.', cursorX: 46, cursorY: 58, scrollY: 45, severity: 'high' },
  { eventType: 'scroll', message: 'Checked social proof, pricing cues, and objection handling below the fold.', cursorX: 34, cursorY: 72, scrollY: 66 },
  { eventType: 'code_scan', message: 'Queued code review step for connected GitHub repos.', cursorX: 58, cursorY: 50, scrollY: 82 },
  { eventType: 'finding', message: 'Found a quick win: make the CTA copy action-and-outcome specific.', cursorX: 64, cursorY: 36, scrollY: 88, severity: 'medium' },
  { eventType: 'complete', message: 'Live preview complete. Real worker will replace this simulator.', cursorX: 86, cursorY: 22, scrollY: 100 },
]

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getEventIcon(type: AgentEvent['event_type']) {
  if (type === 'click' || type === 'input') return MousePointer2
  if (type === 'scroll') return ScrollText
  if (type === 'code_scan') return Code2
  if (type === 'complete') return CheckCircle2
  return Radar
}

export default function LiveAgentPanel({ auditId, targetUrl, canManage }: Props) {
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [isStartingWorker, setIsStartingWorker] = useState(false)
  const [error, setError] = useState('')
  const localRunIdRef = useRef(0)

  const latestEvent = events[events.length - 1]
  const latestCursor = {
    x: Math.max(4, Math.min(92, Number(latestEvent?.cursor_x ?? 18))),
    y: Math.max(6, Math.min(86, Number(latestEvent?.cursor_y ?? 18))),
  }
  const scrollY = Math.max(0, Math.min(100, Number(latestEvent?.scroll_y ?? 0)))
  const isRunning = activeSession?.status === 'running' || isStarting || isStartingWorker
  const latestScreenshotUrl = [...events].reverse().find((event) => event.screenshot_url)?.screenshot_url || null
  const previewUrl = latestEvent?.current_url || activeSession?.current_url || targetUrl
  const activeSessionId = activeSession?.id || ''
  const activeSessionStatus = activeSession?.status || ''
  const latestEventAgeSeconds = latestEvent ? Math.floor((Date.now() - new Date(latestEvent.created_at).getTime()) / 1000) : 0
  const isWaitingForFrame = activeSession?.status === 'running' && !latestScreenshotUrl

  const findings = useMemo(() => {
    return events.filter((event) => event.event_type === 'finding')
  }, [events])

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const res = await fetch(`/api/agent/sessions?auditId=${encodeURIComponent(auditId)}`, { cache: 'no-store' })
        const payload = (await res.json()) as { sessions?: AgentSession[] }
        if (!active) return
        const nextSessions = Array.isArray(payload.sessions) ? payload.sessions : []
        setActiveSession(nextSessions[0] || null)
      } catch {
        if (active) setError('Could not load live agent sessions.')
      }
    })()

    return () => {
      active = false
    }
  }, [auditId])

  useEffect(() => {
    if (!activeSessionId) {
      setEvents([])
      return
    }

    let active = true
    let timer: number | null = null

    async function loadEvents() {
      try {
        const [eventsRes, sessionsRes] = await Promise.all([
          fetch(`/api/agent/sessions/${encodeURIComponent(activeSessionId)}/events`, { cache: 'no-store' }),
          fetch(`/api/agent/sessions?auditId=${encodeURIComponent(auditId)}`, { cache: 'no-store' }),
        ])
        const eventsPayload = (await eventsRes.json()) as { events?: AgentEvent[] }
        const sessionsPayload = (await sessionsRes.json()) as { sessions?: AgentSession[] }
        if (active) {
          setEvents(Array.isArray(eventsPayload.events) ? eventsPayload.events : [])
          const nextSessions = Array.isArray(sessionsPayload.sessions) ? sessionsPayload.sessions : []
          const nextActive = nextSessions.find((session) => session.id === activeSessionId) || nextSessions[0] || null
          if (nextActive) setActiveSession(nextActive)
        }
      } catch {
        if (active) setEvents([])
      }
    }

    void loadEvents()

    if (activeSessionStatus === 'queued' || activeSessionStatus === 'running') {
      timer = window.setInterval(() => {
        void loadEvents()
      }, 1500)
    }

    const channel = supabase
      .channel(`agent-session-${activeSessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'agent_events', filter: `session_id=eq.${activeSessionId}` },
        (payload) => {
          const inserted = payload.new as AgentEvent
          setEvents((prev) => {
            if (prev.some((event) => event.id === inserted.id)) return prev
            return [...prev, inserted].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'agent_sessions', filter: `id=eq.${activeSessionId}` },
        (payload) => {
          setActiveSession(payload.new as AgentSession)
        }
      )
      .subscribe()

    return () => {
      active = false
      if (timer) window.clearInterval(timer)
      supabase.removeChannel(channel)
    }
  }, [activeSessionId, activeSessionStatus, auditId])

  async function updateSession(sessionId: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/agent/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const payload = (await res.json().catch(() => ({}))) as { session?: AgentSession; error?: string }
    if (!res.ok || !payload.session) throw new Error(payload.error || 'Failed to update session')
    setActiveSession(payload.session)
    return payload.session
  }

  async function createEvent(sessionId: string, event: (typeof PREVIEW_EVENTS)[number]) {
    const res = await fetch(`/api/agent/sessions/${encodeURIComponent(sessionId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        currentUrl: targetUrl,
        metadata: { source: 'preview-simulator' },
      }),
    })
    const payload = (await res.json().catch(() => ({}))) as { event?: AgentEvent; error?: string }
    if (!res.ok || !payload.event) throw new Error(payload.error || 'Failed to create event')
    setEvents((prev) => {
      if (prev.some((entry) => entry.id === payload.event?.id)) return prev
      return [...prev, payload.event as AgentEvent]
    })
  }

  async function startPreviewSession() {
    if (!canManage || isRunning) return

    const runId = localRunIdRef.current + 1
    localRunIdRef.current = runId
    setIsStarting(true)
    setError('')
    setEvents([])

    try {
      const res = await fetch('/api/agent/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, targetUrl, status: 'running' }),
      })
      const payload = (await res.json().catch(() => ({}))) as { session?: AgentSession; error?: string }
      if (!res.ok || !payload.session) throw new Error(payload.error || 'Failed to create live agent session')

      setActiveSession(payload.session)

      for (const event of PREVIEW_EVENTS) {
        if (localRunIdRef.current !== runId) return
        await createEvent(payload.session.id, event)
        await wait(1150)
      }

      if (localRunIdRef.current === runId) {
        await updateSession(payload.session.id, {
          status: 'completed',
          summary: 'Preview simulation completed. Connect the remote browser worker to stream real navigation events here.',
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Live preview failed'
      setError(message)
      if (activeSession?.id) {
        await updateSession(activeSession.id, { status: 'failed', errorMessage: message }).catch(() => undefined)
      }
    } finally {
      setIsStarting(false)
    }
  }

  async function startBrowserWorkerSession() {
    if (!canManage || isRunning) return

    localRunIdRef.current += 1
    setIsStartingWorker(true)
    setError('')
    setEvents([])

    try {
      const res = await fetch('/api/agent/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, targetUrl }),
      })
      const payload = (await res.json().catch(() => ({}))) as { session?: AgentSession; error?: string }
      if (!res.ok || !payload.session) {
        throw new Error(payload.error || 'Failed to start browser worker')
      }

      setActiveSession(payload.session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start browser worker')
    } finally {
      setIsStartingWorker(false)
    }
  }

  async function cancelActiveSession() {
    if (!activeSession?.id || activeSession.status !== 'running') return

    setError('')
    try {
      await updateSession(activeSession.id, {
        status: 'cancelled',
        errorMessage: 'Run cancelled from the dashboard.',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel live agent run')
    }
  }

  return (
    <section className="print-hide rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            <Bot className="h-3.5 w-3.5" />
            Live Agent
          </p>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">Visible Website Walkthrough</h3>
          <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-300">
            This preview streams the same event shape the real browser worker will emit: navigation, cursor movement, scrolling, clicks, findings, and code-review checkpoints.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-col sm:flex-row gap-2">
            {activeSession?.status === 'running' && (
              <button
                type="button"
                onClick={cancelActiveSession}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/60 px-4 py-2 text-xs font-black uppercase tracking-widest text-red-700 dark:text-red-300"
              >
                Stop Run
              </button>
            )}
            <button
              type="button"
              onClick={startBrowserWorkerSession}
              disabled={isRunning}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-white dark:text-slate-900 disabled:opacity-60"
            >
              <Play className="h-3.5 w-3.5" />
              {isStartingWorker ? 'Starting' : activeSession?.status === 'running' ? 'Running' : 'Run Real Agent'}
            </button>
            <button
              type="button"
              onClick={startPreviewSession}
              disabled={isRunning}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white disabled:opacity-60"
            >
              Demo Preview
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/25 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {activeSession?.status === 'failed' && activeSession.error_message && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          {activeSession.error_message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-950">
          <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-2 truncate rounded-lg bg-white/8 px-3 py-1 text-xs text-slate-300">{previewUrl}</span>
          </div>

          <div className="relative h-[320px] overflow-hidden bg-slate-100 dark:bg-slate-950">
            {latestScreenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latestScreenshotUrl}
                alt="Live browser screenshot"
                className="h-full w-full object-cover"
              />
            ) : activeSession?.status === 'running' ? (
              <>
                <iframe
                  src={previewUrl}
                  title="Live browser target preview"
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
                <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  Waiting for the first browser screenshot. Showing the target page directly for now.
                </div>
              </>
            ) : (
              <div
                className="absolute inset-x-0 top-0 transition-transform duration-700 ease-out"
                style={{ transform: `translateY(-${scrollY * 2.2}px)` }}
              >
                <div className="h-[220px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white">
                  <div className="h-5 w-28 rounded-full bg-white/20" />
                  <div className="mt-8 h-10 w-4/5 rounded-xl bg-white/85" />
                  <div className="mt-3 h-4 w-3/5 rounded-lg bg-white/35" />
                  <div className="mt-8 flex gap-3">
                    <div className="h-11 w-36 rounded-xl bg-blue-500" />
                    <div className="h-11 w-28 rounded-xl border border-white/30" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-white p-6">
                  <div className="h-28 rounded-xl border border-slate-200 bg-slate-50" />
                  <div className="h-28 rounded-xl border border-slate-200 bg-slate-50" />
                  <div className="h-28 rounded-xl border border-slate-200 bg-slate-50" />
                </div>
                <div className="bg-slate-50 p-6">
                  <div className="h-8 w-64 rounded-lg bg-slate-900" />
                  <div className="mt-5 grid gap-3">
                    <div className="h-16 rounded-xl bg-white shadow-sm" />
                    <div className="h-16 rounded-xl bg-white shadow-sm" />
                    <div className="h-16 rounded-xl bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            )}

            <div
              className="absolute z-10 transition-all duration-700 ease-out"
              style={{ left: `${latestCursor.x}%`, top: `${latestCursor.y}%` }}
            >
              <MousePointer2 className="h-6 w-6 fill-blue-600 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.55)]" />
            </div>

            {!latestEvent && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-950/70">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-300">Run the preview to see the agent stream.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Timeline</p>
            <span className="rounded-full bg-white dark:bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
              {activeSession?.status || 'idle'}
            </span>
          </div>

          {isWaitingForFrame && (
            <p className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-3 text-xs font-bold text-amber-800 dark:text-amber-200">
              No live screenshot frame yet. Last event was {latestEventAgeSeconds}s ago.
            </p>
          )}

          <div className="max-h-[280px] overflow-auto space-y-2 pr-1">
            {events.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-4 text-sm text-gray-500 dark:text-gray-400">
                No live events yet.
              </p>
            ) : (
              events.map((event) => {
                const Icon = getEventIcon(event.event_type)
                return (
                  <div key={event.id} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-black dark:text-white">{event.message}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">{event.event_type}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {findings.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {findings.map((finding) => (
            <div key={finding.id} className="rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/30 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">{finding.severity || 'finding'}</p>
              <p className="mt-1 text-sm font-bold text-blue-950 dark:text-blue-100">{finding.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
