"use client"

import React, { useRef, useState } from 'react'
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

export default function AuditChecklist({ audit, readOnly = false }: { audit: Audit, readOnly?: boolean }) {
  const initialChecklist = audit?.report_content?.checklist || []
  const initialCompleted: string[] =
    audit?.report_content?.completed_tasks ||
    initialChecklist.filter((item) => item.completed).map((item) => item.issue)
  const [completedTasks, setCompletedTasks] = useState<string[]>(initialCompleted)
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(initialChecklist)
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([])
  const confettiBurstIdRef = useRef(0)
  const allTasksCompleted = checklistItems.length > 0 && checklistItems.every((item) => completedTasks.includes(item.issue))
  const completedCount = checklistItems.filter((item) => completedTasks.includes(item.issue)).length
  const completionPercent = checklistItems.length > 0
    ? Math.round((completedCount / checklistItems.length) * 100)
    : 0

  const copySnippet = async (snippet: string) => {
    try {
      await navigator.clipboard.writeText(snippet)
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

      <div className="space-y-6">
        <div className="sticky top-2 sm:top-4 z-30">
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

        {checklistItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleToggleTask(item.issue)}
            className={`group p-6 rounded-3xl border-2 transition-all duration-300 ${
              completedTasks.includes(item.issue)
                ? 'bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 opacity-60'
                : 'bg-white dark:bg-slate-900 border-white dark:border-slate-800 shadow-sm'
            } ${readOnly ? '' : 'cursor-pointer hover:border-black dark:hover:border-slate-500'}`}
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
                <h4 className={`font-bold text-lg ${completedTasks.includes(item.issue) ? 'line-through text-gray-400 dark:text-gray-500' : 'text-black dark:text-white'}`}>
                  {item.issue}
                </h4>
                <p className="text-gray-500 dark:text-gray-300 text-sm">{item.fix}</p>

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
                          copySnippet(item.code_example as string)
                        }}
                        className="rounded-full border border-gray-200 dark:border-slate-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 text-xs leading-5 text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">
                      {item.code_example}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-300">
                    {item.category}
                  </span>
                  {item.priority === 'high' && (
                    <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-red-50 dark:bg-red-900/35 text-red-500 dark:text-red-300">
                      High Priority
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
