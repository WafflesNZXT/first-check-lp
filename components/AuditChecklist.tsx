"use client"

import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Check } from 'lucide-react'

export default function AuditChecklist({ audit }: { audit: any }) {
  const initialCompleted: string[] = audit?.report_content?.completed_tasks || []
  const [completedTasks, setCompletedTasks] = useState<string[]>(initialCompleted)
  const checklist = audit?.report_content?.checklist || []
  const summary = audit?.report_content?.summary || ''

  const toggleTask = async (taskIssue: string) => {
    const newCompleted = completedTasks.includes(taskIssue)
      ? completedTasks.filter((t) => t !== taskIssue)
      : [...completedTasks, taskIssue]

    setCompletedTasks(newCompleted)

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
    <div className="max-w-3xl mx-auto space-y-12">

      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
          Improvement Roadmap
        </h3>

        {checklist.map((item: any, index: number) => (
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
