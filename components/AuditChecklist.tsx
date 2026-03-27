"use client"

import React, { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check } from 'lucide-react'

type ChecklistItem = {
  issue: string
  fix: string
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
          <div className="print-card rounded-[1.5rem] sm:rounded-[2rem] border border-white/45 bg-white/80 backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.12)] px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                Checklist Progress
              </p>
              <p className="text-lg sm:text-xl font-black text-black tabular-nums">
                {completionPercent}%
              </p>
            </div>
            <div className="print-progress-track mt-2.5 h-2.5 w-full rounded-full bg-black/10 overflow-hidden">
              <div
                className="print-progress-fill h-full rounded-full bg-black transition-[width] duration-500 ease-out"
                style={{ width: `${completionPercent}%` }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completionPercent}
                aria-label="Checklist completion"
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              {completedCount} of {checklistItems.length} completed
            </p>
          </div>
        </div>

        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
          Improvement Roadmap
        </h3>

        {checklistItems.map((item, index) => (
          <div
            key={index}
            onClick={() => handleToggleTask(item.issue)}
            className={`group p-6 rounded-3xl border-2 transition-all duration-300 ${
              completedTasks.includes(item.issue)
                ? 'bg-gray-50 border-gray-100 opacity-60'
                : 'bg-white border-white shadow-sm'
            } ${readOnly ? '' : 'cursor-pointer hover:border-black'}`}
          >
            <div className="flex gap-4 items-start">
              <div
                className={`flex-none mt-1 w-6 h-6 min-w-[24px] min-h-[24px] rounded-full border-2 flex items-center justify-center transition-colors ${
                  completedTasks.includes(item.issue) ? 'bg-black border-black' : 'border-gray-200'
                }`}
              >
                {completedTasks.includes(item.issue) && <Check className="w-4 h-4 text-white" />}
              </div>

              <div className="space-y-1">
                <h4 className={`font-bold text-lg ${completedTasks.includes(item.issue) ? 'line-through text-gray-400' : 'text-black'}`}>
                  {item.issue}
                </h4>
                <p className="text-gray-500 text-sm">{item.fix}</p>

                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-gray-100 text-gray-400">
                    {item.category}
                  </span>
                  {item.priority === 'high' && (
                    <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-red-50 text-red-500">
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
