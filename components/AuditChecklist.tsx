"use client"

import React, { useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check } from 'lucide-react'

type ChecklistItem = {
  issue: string
  fix: string
  selector?: string
  code_example?: string
  category: string
  priority?: string
  completed?: boolean
}

type Audit = {
  id: string
  report_content?: {
    completed_tasks?: string[]
    checklist?: ChecklistItem[]
  }
  checklist_comments?: ChecklistComment[]
}

type ChecklistComment = {
  id: string
  issue: string
  text: string
  author_email: string
  created_at: string
}

type ConfettiPiece = {
  id: string
  color: string
  xStart: string
  yStart: string
  xDrift: string
  yDrop: string
  rotate: string
  delay: string
  duration: string
}

const CONFETTI_COLORS = ['bg-black', 'bg-gray-500', 'bg-gray-400', 'bg-gray-300', 'bg-yellow-400', 'bg-yellow-300']

const CATEGORY_ORDER = ['performance', 'seo', 'ux', 'accessibility', 'copy', 'other'] as const

const CATEGORY_STYLES: Record<string, { label: string; section: string; badge: string; connector: string }> = {
  performance: {
    label: 'Performance',
    section: 'border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/25',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200',
    connector: 'bg-blue-200 dark:bg-blue-900/70',
  },
  seo: {
    label: 'SEO',
    section: 'border-violet-200 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/25',
    badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200',
    connector: 'bg-violet-200 dark:bg-violet-900/70',
  },
  ux: {
    label: 'UX',
    section: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/25',
    badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-200',
    connector: 'bg-emerald-200 dark:bg-emerald-900/70',
  },
  accessibility: {
    label: 'Accessibility',
    section: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/25',
    badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-200',
    connector: 'bg-amber-200 dark:bg-amber-900/70',
  },
  copy: {
    label: 'Copy',
    section: 'border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/60 dark:bg-cyan-950/25',
    badge: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-200',
    connector: 'bg-cyan-200 dark:bg-cyan-900/70',
  },
  other: {
    label: 'Other',
    section: 'border-gray-200 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/60',
    badge: 'bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-200',
    connector: 'bg-gray-200 dark:bg-slate-700',
  },
}

function normalizeCategory(value: string | undefined) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return 'other'
  if (normalized === 'accessibility' || normalized === 'a11y') return 'accessibility'
  if (normalized === 'performance') return 'performance'
  if (normalized === 'seo') return 'seo'
  if (normalized === 'ux' || normalized === 'ui') return 'ux'
  if (normalized === 'copy') return 'copy'
  return 'other'
}

export default function AuditChecklist({
  audit,
  readOnly = false,
  canComment = false,
  viewerEmail,
}: {
  audit: Audit,
  readOnly?: boolean,
  canComment?: boolean,
  viewerEmail?: string,
}) {
  const initialChecklist = audit?.report_content?.checklist || []
  const initialComments = Array.isArray(audit?.checklist_comments) ? audit.checklist_comments : []
  const initialCompleted: string[] =
    audit?.report_content?.completed_tasks ||
    initialChecklist.filter((item) => item.completed).map((item) => item.issue)
  const [completedTasks, setCompletedTasks] = useState<string[]>(initialCompleted)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(initialChecklist)
  const [checklistComments, setChecklistComments] = useState<ChecklistComment[]>(initialComments)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [isCommentSaving, setIsCommentSaving] = useState(false)
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([])
  const [copiedSnippetIssue, setCopiedSnippetIssue] = useState<string | null>(null)
  const confettiBurstIdRef = useRef(0)
  const allTasksCompleted = checklistItems.length > 0 && checklistItems.every((item) => completedTasks.includes(item.issue))
  const completedCount = checklistItems.filter((item) => completedTasks.includes(item.issue)).length
  const completionPercent = checklistItems.length > 0
    ? Math.round((completedCount / checklistItems.length) * 100)
    : 0

  const groupedChecklist = useMemo(() => {
    const buckets = new Map<string, Array<{ item: ChecklistItem; index: number }>>()

    checklistItems.forEach((item, index) => {
      const key = normalizeCategory(item.category)
      const next = buckets.get(key) || []
      next.push({ item, index })
      buckets.set(key, next)
    })

    return Array.from(buckets.entries())
      .sort((a, b) => {
        const aIndex = CATEGORY_ORDER.indexOf(a[0] as (typeof CATEGORY_ORDER)[number])
        const bIndex = CATEGORY_ORDER.indexOf(b[0] as (typeof CATEGORY_ORDER)[number])
        const nextA = aIndex === -1 ? CATEGORY_ORDER.length : aIndex
        const nextB = bIndex === -1 ? CATEGORY_ORDER.length : bIndex
        return nextA - nextB
      })
      .map(([category, items]) => ({
        category,
        styles: CATEGORY_STYLES[category] || CATEGORY_STYLES.other,
        items,
      }))
  }, [checklistItems])

  const copySnippet = async (snippet: string, issue: string) => {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopiedSnippetIssue(issue)
      window.setTimeout(() => {
        setCopiedSnippetIssue((current) => (current === issue ? null : current))
      }, 1200)
    } catch {
    }
  }

  const triggerConfetti = () => {
    if (readOnly) return

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    confettiBurstIdRef.current += 1
    const burstId = confettiBurstIdRef.current

    const generatedPieces: ConfettiPiece[] = Array.from({ length: 96 }, (_, index) => {
      const xStart = `${Math.round(4 + Math.random() * 92)}vw`
      const yStart = `${Math.round(4 + Math.random() * 52)}vh`
      const xDrift = `${Math.round(-120 + Math.random() * 240)}px`
      const yDrop = `${Math.round(120 + Math.random() * 340)}px`
      const rotate = `${Math.round(-420 + Math.random() * 840)}deg`
      const delay = `${Math.round(Math.random() * 240)}ms`
      const duration = `${Math.round(900 + Math.random() * 700)}ms`
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]

      return {
        id: `${burstId}-${index}`,
        color,
        xStart,
        yStart,
        xDrift,
        yDrop,
        rotate,
        delay,
        duration,
      }
    })

    setConfettiPieces(generatedPieces)
    window.setTimeout(() => {
      setConfettiPieces([])
    }, 1700)
  }

  const handleToggleTask = async (taskIssue: string) => {
    if (readOnly) return

    const newCompleted = completedTasks.includes(taskIssue)
      ? completedTasks.filter((t) => t !== taskIssue)
      : [...completedTasks, taskIssue]

    const updatedChecklist = checklistItems.map((item) =>
      item.issue === taskIssue
        ? { ...item, completed: !completedTasks.includes(taskIssue) }
        : item
    )

    const willBeFullyCompleted = updatedChecklist.length > 0 && updatedChecklist.every((item) => newCompleted.includes(item.issue))

    setCompletedTasks(newCompleted)
    setChecklistItems(updatedChecklist)

    if (!allTasksCompleted && willBeFullyCompleted) {
      triggerConfetti()
    }

    const newReportContent = {
      ...(audit?.report_content || {}),
      checklist: updatedChecklist,
      completed_tasks: newCompleted,
    }

    await supabase
      .from('audits')
      .update({ report_content: newReportContent })
      .eq('id', audit.id)
  }

  const handleAddComment = async (issue: string) => {
    if (!canComment || isCommentSaving) return

    const nextText = String(commentDrafts[issue] || '').trim()
    if (!nextText) return

    setIsCommentSaving(true)

    const nextComment: ChecklistComment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      issue,
      text: nextText,
      author_email: viewerEmail || 'unknown@user',
      created_at: new Date().toISOString(),
    }

    const updatedComments = [...checklistComments, nextComment]
    setChecklistComments(updatedComments)

    const { error } = await supabase
      .from('audits')
      .update({ checklist_comments: updatedComments })
      .eq('id', audit.id)

    if (error) {
      setChecklistComments((prev) => prev.filter((comment) => comment.id !== nextComment.id))
      setIsCommentSaving(false)
      return
    }

    setCommentDrafts((prev) => ({ ...prev, [issue]: '' }))
    setIsCommentSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12 relative">
      {confettiPieces.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className={`absolute h-2 w-1.5 rounded-sm animate-checklist-confetti ${piece.color}`}
              style={{
                ['--x-start' as string]: piece.xStart,
                ['--y-start' as string]: piece.yStart,
                ['--x-drift' as string]: piece.xDrift,
                ['--y-drop' as string]: piece.yDrop,
                ['--rotate' as string]: piece.rotate,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
              }}
            />
          ))}
        </div>
      )}

      {copiedSnippetIssue && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 rounded-full border border-gray-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 px-4 py-2 text-xs font-black uppercase tracking-widest text-black dark:text-white shadow-lg backdrop-blur-sm">
          Copied!
        </div>
      )}

      <div className="space-y-6">
        <div className="sticky top-2 sm:top-4 z-10">
          <div className="print-card rounded-[1.5rem] sm:rounded-[2rem] border border-white/45 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.12)] px-4 sm:px-6 py-3 sm:py-4 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Checklist Progress
              </p>
              <p className="text-lg sm:text-xl font-black text-black dark:text-white tabular-nums">
                {completionPercent}%
              </p>
            </div>
            <div className="print-progress-track mt-2.5 h-2.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="print-progress-fill h-full rounded-full bg-black dark:bg-white transition-[width] duration-500 ease-out"
                style={{ width: `${completionPercent}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercent}
                aria-label="Checklist completion"
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
              {completedCount} of {checklistItems.length} completed
            </p>
          </div>
        </div>

        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
          Improvement Roadmap
        </h3>

        <div className="space-y-6">
          {groupedChecklist.map((group, groupIndex) => (
            <section key={group.category} className="relative pl-4">
              {groupIndex < groupedChecklist.length - 1 && (
                <span className={`absolute left-[0.44rem] top-11 -bottom-6 w-0.5 rounded-full ${group.styles.connector}`} />
              )}

              <div className={`rounded-2xl border p-4 sm:p-5 ${group.styles.section}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${group.styles.badge}`}>
                    {group.styles.label}
                  </span>
                  <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    {group.items.length} item{group.items.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {group.items.map(({ item, index }) => (
                    <div
                      key={`${item.issue}-${index}`}
                      onClick={() => handleToggleTask(item.issue)}
                      className={`group p-6 rounded-3xl border-2 transition-all duration-300 ${
                        completedTasks.includes(item.issue)
                          ? 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 opacity-60'
                          : 'bg-white dark:bg-slate-900 border-white dark:border-slate-800 shadow-sm'
                      } ${readOnly ? '' : 'cursor-pointer hover:border-black dark:hover:border-slate-500'} overflow-hidden`}
                    >
                      <div className="flex gap-4 items-start">
                        <div
                          className={`flex-none mt-1 w-6 h-6 min-w-[24px] min-h-[24px] rounded-full border-2 flex items-center justify-center transition-colors ${
                            completedTasks.includes(item.issue) ? 'bg-black dark:bg-white border-black dark:border-white' : 'border-gray-200 dark:border-slate-600'
                          }`}
                        >
                          {completedTasks.includes(item.issue) && <Check className="w-4 h-4 text-white dark:text-slate-900" />}
                        </div>

                        <div className="space-y-1">
                          <h4 className={`font-bold text-lg break-words ${completedTasks.includes(item.issue) ? 'line-through text-gray-400 dark:text-gray-500' : 'text-black dark:text-white'}`}>
                            {item.issue}
                          </h4>
                          <p className="text-gray-500 dark:text-gray-300 text-sm break-words">{item.fix}</p>

                          {item.selector && (
                            <code className="inline-block mt-1 rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2 py-1 text-[11px] text-gray-700 dark:text-gray-200 break-all">
                              {item.selector}
                            </code>
                          )}

                          {item.code_example && (
                            <div className="mt-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">Quick Fix</p>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    copySnippet(item.code_example as string, item.issue)
                                  }}
                                  className="rounded-full border border-gray-200 dark:border-slate-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                                >
                                  {copiedSnippetIssue === item.issue ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                              <pre className="p-3 text-xs leading-5 text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">
                                {item.code_example}
                              </pre>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${group.styles.badge}`}>
                              {group.styles.label}
                            </span>
                            {item.priority === 'high' && (
                              <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/35 text-red-500 dark:text-red-300">
                                High Priority
                              </span>
                            )}
                          </div>

                          <div className="mt-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/50 p-3" onClick={(event) => event.stopPropagation()}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">Comments</p>

                            <div className="mt-2 space-y-2">
                              {checklistComments.filter((comment) => comment.issue === item.issue).length === 0 ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400">No comments yet.</p>
                              ) : (
                                checklistComments
                                  .filter((comment) => comment.issue === item.issue)
                                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                  .map((comment) => (
                                    <div key={comment.id} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5">
                                      <p className="text-xs text-black dark:text-white whitespace-pre-wrap break-words">{comment.text}</p>
                                      <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{comment.author_email}</p>
                                    </div>
                                  ))
                              )}
                            </div>

                            {canComment && (
                              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  value={commentDrafts[item.issue] || ''}
                                  onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [item.issue]: event.target.value }))}
                                  placeholder="Add a comment for this checklist item"
                                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleAddComment(item.issue)}
                                  disabled={isCommentSaving}
                                  className="rounded-xl bg-black dark:bg-white text-white dark:text-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-60"
                                >
                                  Add Comment
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
