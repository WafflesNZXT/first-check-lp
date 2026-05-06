'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const STAGES = [
  'Fetching site content',
  'Analyzing SEO metadata',
  'Evaluating UX hierarchy',
  'Finalizing roadmap',
] as const

export default function AuditLoading({ processingNotice, captions = [] }: { processingNotice?: string | null; captions?: string[] }) {
  const [activeStage, setActiveStage] = useState(0)

  const completedStages = useMemo(() => {
    return STAGES.map((_, index) => index < activeStage)
  }, [activeStage])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => {
        if (prev >= STAGES.length - 1) return prev
        return prev + 1
      })
    }, 1800)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Step-by-Step</p>

      <div className="space-y-3">
        {STAGES.map((stage, index) => {
          const isFinalStage = index === STAGES.length - 1
          const label = isFinalStage && processingNotice ? processingNotice : stage
          const isCompleted = completedStages[index]
          const isActive = activeStage === index

          return (
            <div
              key={stage}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors ${
                isCompleted
                  ? 'border-green-100 bg-green-50'
                  : isActive
                    ? 'border-black/10 bg-gray-50'
                    : 'border-gray-100 bg-white'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : isActive
                      ? 'border-black text-black'
                      : 'border-gray-200 text-gray-300'
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              </span>

              <p className={`text-sm ${isCompleted ? 'text-green-700' : isActive ? 'text-black font-semibold' : 'text-gray-400'}`}>
                {label}
              </p>
            </div>
          )
        })}
      </div>

      {captions.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Audit Progress</p>
          <pre className="mt-2 max-h-40 overflow-auto text-xs whitespace-pre-wrap text-gray-700">
            {captions.join('\n')}
          </pre>
        </div>
      )}
    </div>
  )
}
