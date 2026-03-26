'use client'

import { useEffect, useMemo, useState } from 'react'

export default function ProgressBar({ status }: { status: string }) {
  const taskLabels = useMemo(
    () => [
      'fetching site content...',
      'extracting performance signals...',
      'checking seo and ux issues...',
      'building prioritized fixes...',
      'finalizing audit report...',
    ],
    []
  )

  const [taskIndex, setTaskIndex] = useState(0)
  const [progress, setProgress] = useState(status === 'completed' ? 100 : 8)

  useEffect(() => {
    if (status === 'completed') {
      setProgress(100)
      return
    }

    const tick = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 94) return 94
        const bump = prev < 40 ? 6 : prev < 70 ? 4 : 2
        return Math.min(94, prev + bump)
      })
    }, 900)

    return () => clearInterval(tick)
  }, [status])

  useEffect(() => {
    if (status !== 'processing') return
    const rotate = setInterval(() => {
      setTaskIndex((prev) => (prev + 1) % taskLabels.length)
    }, 2200)

    return () => clearInterval(rotate)
  }, [status, taskLabels.length])

  const label = status === 'completed' ? 'audit finished' : taskLabels[taskIndex]

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {label}
        </span>
        <span className="text-xs font-bold text-black">{Math.round(progress)}%</span>
      </div>

      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
        <div className="h-full bg-black transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}