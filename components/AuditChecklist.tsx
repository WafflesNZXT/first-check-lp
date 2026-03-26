"use client"

import React, { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check } from 'lucide-react'

type ChecklistItem = {
  issue: string
  fix: string
  category: string
  priority?: string
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

export default function AuditChecklist({ audit }: { audit: Audit }) {
  const initialCompleted: string[] = audit?.report_content?.completed_tasks || []
  const [completedTasks, setCompletedTasks] = useState<string[]>(initialCompleted)
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([])
  const confettiBurstIdRef = useRef(0)
  const checklist = audit?.report_content?.checklist || []
  const allTasksCompleted = checklist.length > 0 && checklist.every((item) => completedTasks.includes(item.issue))

  const triggerConfetti = () => {
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

  const toggleTask = async (taskIssue: string) => {
    const newCompleted = completedTasks.includes(taskIssue)
      ? completedTasks.filter((t) => t !== taskIssue)
      : [...completedTasks, taskIssue]

    const willBeFullyCompleted = checklist.length > 0 && checklist.every((item) => newCompleted.includes(item.issue))

    setCompletedTasks(newCompleted)

    if (!allTasksCompleted && willBeFullyCompleted) {
      triggerConfetti()
    }

    const newReportContent = {
      ...(audit?.report_content || {}),
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
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
          Improvement Roadmap
        </h3>

        {checklist.map((item, index) => (
          <div
            key={index}
            onClick={() => toggleTask(item.issue)}
            className={`group cursor-pointer p-6 rounded-3xl border-2 transition-all duration-300 ${
              completedTasks.includes(item.issue)
                ? 'bg-gray-50 border-gray-100 opacity-60'
                : 'bg-white border-white shadow-sm hover:border-black'
            }`}
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
