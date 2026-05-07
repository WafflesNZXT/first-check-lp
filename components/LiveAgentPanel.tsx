'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check, CheckCircle2, Code2, MousePointer2, Pause, Play, Radar, RotateCcw, ScrollText, Sparkles, Video, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type AgentSession = {
  id: string
  audit_id: string
  user_id: string
  target_url: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  mode: string
  current_url: string | null
  live_view_url: string | null
  replay_url: string | null
  worker_id: string | null
  last_heartbeat_at: string | null
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

type ConfettiPiece = {
  id: number
  left: number
  top: number
  delay: number
  color: string
  rotate: number
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

function getSeverityTone(severity: AgentEvent['severity']) {
  if (severity === 'critical') {
    return {
      card: 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/25',
      badge: 'bg-rose-600 text-white',
      text: 'text-rose-950 dark:text-rose-100',
      muted: 'text-rose-700 dark:text-rose-200',
      check: 'border-rose-300 bg-white text-rose-700 data-[checked=true]:bg-rose-600 data-[checked=true]:text-white',
    }
  }
  if (severity === 'high') {
    return {
      card: 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/25',
      badge: 'bg-amber-500 text-amber-950',
      text: 'text-amber-950 dark:text-amber-100',
      muted: 'text-amber-800 dark:text-amber-200',
      check: 'border-amber-300 bg-white text-amber-700 data-[checked=true]:bg-amber-500 data-[checked=true]:text-amber-950',
    }
  }
  if (severity === 'low') {
    return {
      card: 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70',
      badge: 'bg-slate-600 text-white',
      text: 'text-slate-950 dark:text-slate-100',
      muted: 'text-slate-600 dark:text-slate-300',
      check: 'border-slate-300 bg-white text-slate-700 data-[checked=true]:bg-slate-700 data-[checked=true]:text-white',
    }
  }
  return {
    card: 'border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/25',
    badge: 'bg-blue-600 text-white',
    text: 'text-blue-950 dark:text-blue-100',
    muted: 'text-blue-700 dark:text-blue-200',
    check: 'border-blue-300 bg-white text-blue-700 data-[checked=true]:bg-blue-600 data-[checked=true]:text-white',
  }
}

function splitFindingText(message: string) {
  const [issuePart, evidencePart = ''] = message.split(/\s+Evidence:\s+/i)
  return {
    issue: issuePart.trim(),
    evidence: evidencePart.trim(),
  }
}

export default function LiveAgentPanel({ auditId, targetUrl, canManage }: Props) {
  const [activeSession, setActiveSession] = useState<AgentSession | null>(null)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [isStarting, setIsStarting] = useState(false)
  const [isStartingWorker, setIsStartingWorker] = useState(false)
  const [error, setError] = useState('')
  const [isReplayOpen, setIsReplayOpen] = useState(false)
  const [isReplayPlaying, setIsReplayPlaying] = useState(false)
  const [replayIndex, setReplayIndex] = useState(0)
  const [completedFindingIds, setCompletedFindingIds] = useState<number[]>([])
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([])
  const confettiBurstIdRef = useRef(0)
  const localRunIdRef = useRef(0)

  const latestEvent = events[events.length - 1]
  const latestCursor = {
    x: Math.max(4, Math.min(92, Number(latestEvent?.cursor_x ?? 18))),
    y: Math.max(6, Math.min(86, Number(latestEvent?.cursor_y ?? 18))),
  }
  const scrollY = Math.max(0, Math.min(100, Number(latestEvent?.scroll_y ?? 0)))
  const isRunning = activeSession?.status === 'queued' || activeSession?.status === 'running' || isStarting || isStartingWorker
  const latestScreenshotUrl = [...events].reverse().find((event) => event.screenshot_url)?.screenshot_url || null
  const screenshotEvents = useMemo(() => {
    return events.filter((event) => event.screenshot_url)
  }, [events])
  const replayEvent = screenshotEvents[Math.min(replayIndex, Math.max(0, screenshotEvents.length - 1))]
  const canReplay = Boolean(activeSession?.replay_url || screenshotEvents.length > 0)
  const liveViewUrl = activeSession?.live_view_url || null
  const previewUrl = latestEvent?.current_url || activeSession?.current_url || targetUrl
  const activeSessionId = activeSession?.id || ''
  const activeSessionStatus = activeSession?.status || ''
  const latestEventAgeSeconds = latestEvent ? Math.floor((Date.now() - new Date(latestEvent.created_at).getTime()) / 1000) : 0
  const isWaitingForFrame = activeSession?.status === 'running' && !latestScreenshotUrl
  const isStaleRun = activeSession?.status === 'running' && latestEventAgeSeconds > 90

  const findings = useMemo(() => {
    return events.filter((event) => event.event_type === 'finding')
  }, [events])
  const completedFindingCount = findings.filter((finding) => completedFindingIds.includes(finding.id)).length
  const allFindingsCompleted = findings.length > 0 && completedFindingCount === findings.length
  const completionPercent = findings.length > 0 ? Math.round((completedFindingCount / findings.length) * 100) : 0

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

  useEffect(() => {
    if (!activeSessionId) {
      setCompletedFindingIds([])
      return
    }

    try {
      const stored = window.localStorage.getItem(`audo-agent-findings:${activeSessionId}`)
      const parsed = stored ? JSON.parse(stored) : []
      setCompletedFindingIds(Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Number.isFinite) : [])
    } catch {
      setCompletedFindingIds([])
    }
  }, [activeSessionId])

  useEffect(() => {
    if (!activeSessionId) return

    window.localStorage.setItem(`audo-agent-findings:${activeSessionId}`, JSON.stringify(completedFindingIds))
  }, [activeSessionId, completedFindingIds])

  useEffect(() => {
    setReplayIndex((prev) => Math.min(prev, Math.max(0, screenshotEvents.length - 1)))
  }, [screenshotEvents.length])

  useEffect(() => {
    if (!isReplayPlaying || screenshotEvents.length <= 1) return

    const timer = window.setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= screenshotEvents.length - 1) {
          setIsReplayPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 900)

    return () => window.clearInterval(timer)
  }, [isReplayPlaying, screenshotEvents.length])

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

  function openReplay() {
    if (activeSession?.replay_url) {
      window.open(activeSession.replay_url, '_blank', 'noopener,noreferrer')
      return
    }

    if (!screenshotEvents.length) return
    setReplayIndex(0)
    setIsReplayPlaying(true)
    setIsReplayOpen(true)
  }

  function triggerConfetti() {
    confettiBurstIdRef.current += 1
    const burstId = confettiBurstIdRef.current
    const colors = ['bg-blue-500', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-violet-400']
    const pieces = Array.from({ length: 28 }, (_, index) => ({
      id: burstId * 100 + index,
      left: 8 + Math.random() * 84,
      top: 8 + Math.random() * 28,
      delay: Math.random() * 0.18,
      color: colors[index % colors.length],
      rotate: Math.random() * 220 - 110,
    }))

    setConfettiPieces(pieces)
    window.setTimeout(() => {
      setConfettiPieces((current) => current.filter((piece) => piece.id < burstId * 100 || piece.id >= burstId * 100 + 100))
    }, 1300)
  }

  function toggleFinding(findingId: number) {
    setCompletedFindingIds((current) => {
      const next = current.includes(findingId)
        ? current.filter((id) => id !== findingId)
        : [...current, findingId]
      const nextCompletedCount = findings.filter((finding) => next.includes(finding.id)).length
      if (findings.length > 0 && nextCompletedCount === findings.length && current.length !== next.length) {
        triggerConfetti()
      }
      return next
    })
  }

  function completeAllFindings() {
    if (!findings.length) return

    setCompletedFindingIds(findings.map((finding) => finding.id))
    if (!allFindingsCompleted) triggerConfetti()
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
            Watch the agent use the site, stream browser evidence, and convert findings into work your team can act on.
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
              {isStartingWorker ? 'Queuing' : activeSession?.status === 'running' ? 'Running' : activeSession?.status === 'queued' ? 'Queued' : 'Run Agent'}
            </button>
            <button
              type="button"
              onClick={openReplay}
              disabled={!canReplay}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white disabled:opacity-50"
            >
              <Video className="h-3.5 w-3.5" />
              Replay
            </button>
            <button
              type="button"
              onClick={startPreviewSession}
              disabled={isRunning}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white disabled:opacity-60"
            >
              Demo
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
            {liveViewUrl ? (
              <iframe
                src={liveViewUrl}
                title="Live browser session"
                className="h-full w-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            ) : latestScreenshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={latestScreenshotUrl}
                alt="Live browser screenshot"
                className="h-full w-full object-cover"
              />
            ) : activeSession?.status === 'running' || activeSession?.status === 'queued' ? (
              <>
                <iframe
                  src={previewUrl}
                  title="Live browser target preview"
                  className="h-full w-full border-0 bg-white"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
                <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  {activeSession.status === 'queued'
                    ? 'The live agent run is queued. A hosted worker will pick it up automatically.'
                    : 'Waiting for the first browser frame. Showing the target page directly for now.'}
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

            {!latestEvent && !liveViewUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-950/70">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-300">Run the agent to start the visible walkthrough.</p>
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

          {isStaleRun && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/25 p-3 text-xs font-bold text-amber-800 dark:text-amber-200">
              <p>This run has not reported a new browser step in over 90 seconds.</p>
              {canManage && (
                <button
                  type="button"
                  onClick={cancelActiveSession}
                  className="mt-2 rounded-lg border border-amber-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"
                >
                  Stop stale run
                </button>
              )}
            </div>
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
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 sm:p-4">
          {confettiPieces.length > 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
              {confettiPieces.map((piece) => (
                <span
                  key={piece.id}
                  className={`absolute h-2 w-1.5 rounded-sm animate-checklist-confetti ${piece.color}`}
                  style={{
                    left: `${piece.left}%`,
                    top: `${piece.top}%`,
                    animationDelay: `${piece.delay}s`,
                    transform: `rotate(${piece.rotate}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Agent Checklist</p>
              <h4 className="mt-1 text-lg font-black tracking-tight text-black dark:text-white">Live findings</h4>
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-[130px]">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                  <span>{completedFindingCount}/{findings.length}</span>
                  <span>{completionPercent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-black dark:bg-white transition-all" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={completeAllFindings}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white dark:bg-white dark:text-slate-950"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Complete all
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {findings.map((finding) => {
              const tone = getSeverityTone(finding.severity)
              const completed = completedFindingIds.includes(finding.id)
              const { issue, evidence } = splitFindingText(finding.message)
              const fix = typeof finding.metadata?.fix === 'string' ? finding.metadata.fix : ''

              return (
                <button
                  type="button"
                  key={finding.id}
                  onClick={() => toggleFinding(finding.id)}
                  className={`group min-h-[138px] rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${tone.card} ${completed ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      data-checked={completed}
                      className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${tone.check}`}
                    >
                      {completed && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${tone.badge}`}>
                          {finding.severity || 'finding'}
                        </span>
                        {completed && <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Done</span>}
                      </div>
                      <p className={`mt-3 text-sm font-black leading-snug ${tone.text} ${completed ? 'line-through' : ''}`}>
                        {issue}
                      </p>
                      {evidence && (
                        <p className={`mt-3 border-l-2 border-current/30 pl-3 text-xs font-semibold leading-relaxed ${tone.muted}`}>
                          <span className="font-black">Evidence: </span>{evidence}
                        </p>
                      )}
                      {fix && (
                        <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold leading-relaxed text-slate-700 dark:bg-slate-950/50 dark:text-slate-200">
                          <span className="font-black">Fix: </span>{fix}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isReplayOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close replay"
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setIsReplayOpen(false)
              setIsReplayPlaying(false)
            }}
          />
          <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">Agent Replay</p>
                <p className="mt-1 max-w-xl truncate text-xs font-bold text-slate-300">{replayEvent?.message || 'Recorded browser walkthrough'}</p>
              </div>
              <button
                type="button"
                aria-label="Close replay"
                onClick={() => {
                  setIsReplayOpen(false)
                  setIsReplayPlaying(false)
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative aspect-video bg-black">
              {replayEvent?.screenshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={replayEvent.screenshot_url} alt="Recorded agent step" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">No recorded frames yet.</div>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplayPlaying((prev) => !prev)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black uppercase tracking-widest text-slate-950"
                >
                  {isReplayPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {isReplayPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplayIndex(0)
                    setIsReplayPlaying(true)
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white hover:bg-white/10"
                  aria-label="Restart replay"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, screenshotEvents.length - 1)}
                value={replayIndex}
                onChange={(event) => {
                  setReplayIndex(Number(event.target.value))
                  setIsReplayPlaying(false)
                }}
                className="min-w-0 flex-1"
              />
              <span className="text-xs font-bold text-slate-400">
                {Math.min(replayIndex + 1, screenshotEvents.length || 1)} / {Math.max(1, screenshotEvents.length)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
