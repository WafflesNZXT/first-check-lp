'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type VoteValue = 'up' | 'down'

const IDEA_KEY = 'repo-agent-dashboard-edits'
const LOCAL_VOTE_KEY = `dashboard_vote_${IDEA_KEY}`
const LOCAL_CLIENT_ID_KEY = 'firstcheck_idea_client_id'

function getClientId() {
  if (typeof window === 'undefined') return ''
  const existing = window.localStorage.getItem(LOCAL_CLIENT_ID_KEY)
  if (existing) return existing

  const created = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(LOCAL_CLIENT_ID_KEY, created)
  return created
}

export default function DashboardFeatureVoteCard() {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null)
  const [expanded, setExpanded] = useState(false)

  const hasVoted = useMemo(() => Boolean(selectedVote), [selectedVote])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(LOCAL_VOTE_KEY)
    if (saved === 'up' || saved === 'down') {
      setSelectedVote(saved)
      setMessage('Thanks — your vote is saved.')
    }
  }, [])

  async function submitVote(vote: VoteValue) {
    if (submitting || hasVoted) return

    try {
      setSubmitting(true)
      setMessage('')

      const response = await fetch('/api/idea-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaKey: IDEA_KEY,
          vote,
          clientId: getClientId(),
          context: 'dashboard_card',
        }),
      })

      if (!response.ok) {
        throw new Error('Vote request failed')
      }

      window.localStorage.setItem(LOCAL_VOTE_KEY, vote)
      setSelectedVote(vote)
      setMessage('Thanks for the feedback.')
    } catch {
      setMessage('Could not save your vote. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mb-10 sm:mb-14">
      <div className="rounded-[1.5rem] sm:rounded-[2rem] border border-blue-100 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/25 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Feature vote</p>
            <h2 className="mt-1 text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">Should we add repo + AI auto-fix flow in dashboard?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Connect repo/code files, review AI changes, and ship from one place.</p>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2 text-xs font-bold text-blue-700 dark:text-blue-300 underline underline-offset-2"
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submitVote('up')}
              disabled={submitting || hasVoted}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors ${
                selectedVote === 'up'
                  ? 'border-emerald-300 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                  : 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-label="Upvote feature"
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Upvote
            </button>
            <button
              type="button"
              onClick={() => submitVote('down')}
              disabled={submitting || hasVoted}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors ${
                selectedVote === 'down'
                  ? 'border-red-300 bg-red-500/20 text-red-800 dark:text-red-200'
                  : 'border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-label="Downvote feature"
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Downvote
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 rounded-xl border border-blue-200/70 dark:border-blue-800/70 bg-white/70 dark:bg-slate-900/55 p-4 text-sm text-gray-700 dark:text-gray-200 space-y-2">
            <p>This feature would let you connect repo/code files, generate proposed fixes from audits, then approve edits before they are applied.</p>
            <p>Your vote decides if we prioritize this now.</p>
          </div>
        )}

        {message && <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">{message}</p>}
      </div>
    </section>
  )
}
