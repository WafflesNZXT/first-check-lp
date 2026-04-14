'use client'

import { useEffect, useMemo, useState } from 'react'

type TaskStatus = 'open' | 'in_progress' | 'in_review' | 'done' | 'wont_fix'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

type WorkflowTask = {
  id: string
  audit_id: string
  title: string
  notes: string | null
  source_issue: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_email: string | null
  due_date: string | null
  created_by_user_id: string
  created_at: string
  updated_at: string
}

type WorkflowTaskComment = {
  id: string
  task_id: string
  text: string
  author_email: string
  created_at: string
}

type Props = {
  auditId: string
  canManage: boolean
  viewerUserId: string
  viewerEmail?: string
  assigneeEmails: string[]
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'wont_fix', label: 'Won’t Fix' },
]

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

export default function AuditWorkflowPanel({ auditId, canManage, viewerUserId, viewerEmail, assigneeEmails }: Props) {
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [commentsByTask, setCommentsByTask] = useState<Record<string, WorkflowTaskComment[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [commentSavingTaskId, setCommentSavingTaskId] = useState<string | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newSourceIssue, setNewSourceIssue] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newAssignedEmail, setNewAssignedEmail] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')

  const assigneeOptions = useMemo(() => {
    return Array.from(new Set(assigneeEmails.map((email) => email.trim().toLowerCase()).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  }, [assigneeEmails])
  const normalizedViewerEmail = String(viewerEmail || '').trim().toLowerCase()

  const statusCounts = useMemo(() => {
    return tasks.reduce<Record<TaskStatus, number>>(
      (acc, task) => {
        acc[task.status] += 1
        return acc
      },
      { open: 0, in_progress: 0, in_review: 0, done: 0, wont_fix: 0 }
    )
  }, [tasks])

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const res = await fetch(`/api/workflow/tasks?auditId=${encodeURIComponent(auditId)}`, { cache: 'no-store' })
        const payload = (await res.json()) as { tasks?: WorkflowTask[]; comments?: WorkflowTaskComment[]; error?: string }

        if (!active) return

        if (!res.ok) {
          setError(payload.error || 'Failed to load tasks')
          setTasks([])
          setIsLoading(false)
          return
        }

        setTasks(Array.isArray(payload.tasks) ? payload.tasks : [])
        const nextCommentsByTask = (Array.isArray(payload.comments) ? payload.comments : []).reduce<Record<string, WorkflowTaskComment[]>>((acc, comment) => {
          const taskId = String(comment.task_id || '')
          if (!taskId) return acc
          if (!acc[taskId]) acc[taskId] = []
          acc[taskId].push(comment)
          return acc
        }, {})
        setCommentsByTask(nextCommentsByTask)
        setError('')
      } catch {
        if (!active) return
        setError('Failed to load tasks')
        setTasks([])
        setCommentsByTask({})
      }

      if (active) {
        setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [auditId])

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage || isCreating) return

    const title = newTitle.trim()
    if (!title) return

    setIsCreating(true)
    setError('')

    try {
      const res = await fetch('/api/workflow/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          title,
          sourceIssue: newSourceIssue.trim(),
          notes: newNotes.trim(),
          assignedEmail: newAssignedEmail,
          dueDate: newDueDate,
          priority: newPriority,
          status: 'open',
        }),
      })

      const payload = (await res.json()) as { task?: WorkflowTask; error?: string }
      if (!res.ok || !payload.task) {
        setError(payload.error || 'Failed to create task')
        setIsCreating(false)
        return
      }

      setTasks((prev) => [payload.task as WorkflowTask, ...prev])
      setNewTitle('')
      setNewSourceIssue('')
      setNewNotes('')
      setNewAssignedEmail('')
      setNewDueDate('')
      setNewPriority('medium')
    } catch {
      setError('Failed to create task')
    }

    setIsCreating(false)
  }

  const patchTask = async (taskId: string, patch: Record<string, string>) => {
    setBusyTaskId(taskId)
    setError('')

    try {
      const res = await fetch(`/api/workflow/tasks/${encodeURIComponent(taskId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      const payload = (await res.json()) as { task?: WorkflowTask; error?: string }
      if (!res.ok || !payload.task) {
        setError(payload.error || 'Failed to update task')
        setBusyTaskId(null)
        return
      }

      setTasks((prev) => prev.map((task) => (task.id === taskId ? payload.task as WorkflowTask : task)))
    } catch {
      setError('Failed to update task')
    }

    setBusyTaskId(null)
  }

  const deleteTask = async (taskId: string) => {
    setBusyTaskId(taskId)
    setError('')

    try {
      const res = await fetch(`/api/workflow/tasks/${encodeURIComponent(taskId)}`, { method: 'DELETE' })
      const payload = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok || !payload.success) {
        setError(payload.error || 'Failed to delete task')
        setBusyTaskId(null)
        return
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      setCommentsByTask((prev) => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
    } catch {
      setError('Failed to delete task')
    }

    setBusyTaskId(null)
  }

  const addComment = async (taskId: string) => {
    const text = String(commentDrafts[taskId] || '').trim()
    if (!text || commentSavingTaskId) return

    setCommentSavingTaskId(taskId)
    setError('')

    try {
      const res = await fetch(`/api/workflow/tasks/${encodeURIComponent(taskId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const payload = (await res.json()) as { comment?: WorkflowTaskComment; error?: string }
      if (!res.ok || !payload.comment) {
        setError(payload.error || 'Failed to add comment')
        setCommentSavingTaskId(null)
        return
      }

      setCommentsByTask((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), payload.comment as WorkflowTaskComment] }))
      setCommentDrafts((prev) => ({ ...prev, [taskId]: '' }))
    } catch {
      setError('Failed to add comment')
    }

    setCommentSavingTaskId(null)
  }

  return (
    <section className="rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Team Workflow</p>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white">Execution Board</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest">
          <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-gray-700 dark:text-gray-200">Open: {statusCounts.open}</span>
          <span className="rounded-full bg-amber-50 dark:bg-amber-950/35 px-2.5 py-1 text-amber-700 dark:text-amber-300">In Progress: {statusCounts.in_progress}</span>
          <span className="rounded-full bg-blue-50 dark:bg-blue-950/35 px-2.5 py-1 text-blue-700 dark:text-blue-300">In Review: {statusCounts.in_review}</span>
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/35 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">Done: {statusCounts.done}</span>
        </div>
      </div>

      {canManage ? (
        <form onSubmit={handleCreateTask} className="rounded-2xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white placeholder:text-gray-400"
              placeholder="Task title (required)"
              maxLength={160}
              required
            />
            <input
              value={newSourceIssue}
              onChange={(event) => setNewSourceIssue(event.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white placeholder:text-gray-400"
              placeholder="Linked audit issue (optional)"
              maxLength={220}
            />
          </div>

          <textarea
            value={newNotes}
            onChange={(event) => setNewNotes(event.target.value)}
            className="w-full min-h-[84px] rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white placeholder:text-gray-400"
            placeholder="Implementation notes (optional)"
            maxLength={2000}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={newAssignedEmail}
              onChange={(event) => setNewAssignedEmail(event.target.value)}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white"
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((email) => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>

            <select
              value={newPriority}
              onChange={(event) => setNewPriority(event.target.value as TaskPriority)}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority.value} value={priority.value}>{priority.label}</option>
              ))}
            </select>

            <input
              value={newDueDate}
              onChange={(event) => setNewDueDate(event.target.value)}
              type="date"
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-white dark:text-slate-900 disabled:opacity-60"
            >
              {isCreating ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
          You have view access. Ask an editor to create or assign tasks.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/25 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading workflow tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No tasks yet for this audit.</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <article key={task.id} className="rounded-2xl border border-gray-200 dark:border-slate-700 p-3 sm:p-4 space-y-4">
              {(() => {
                const isCreator = task.created_by_user_id === viewerUserId
                const isAssignee = !!normalizedViewerEmail && String(task.assigned_email || '').trim().toLowerCase() === normalizedViewerEmail
                const canEditAll = isCreator
                const canUpdateStageOnly = !isCreator && isAssignee
                const taskComments = (commentsByTask[task.id] || []).slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                const canCommentOnTask = isCreator || isAssignee

                return (
                  <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-black text-black dark:text-white break-words">{task.title}</h4>
                  {task.source_issue && <p className="text-xs text-gray-500 dark:text-gray-300">Issue: {task.source_issue}</p>}
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/35 px-2.5 py-1 text-blue-700 dark:text-blue-300">{task.status.replace('_', ' ')}</span>
                  <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-gray-700 dark:text-gray-200">{task.priority}</span>
                  {task.due_date && <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-gray-700 dark:text-gray-200">Due {task.due_date}</span>}
                  <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-gray-700 dark:text-gray-200">{isCreator ? 'Creator' : isAssignee ? 'Assigned' : 'Viewer'}</span>
                </div>
              </div>

              {task.notes && <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">{task.notes}</p>}

              {canEditAll ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                <select
                  value={task.status}
                  disabled={!canManage || busyTaskId === task.id}
                  onChange={(event) => void patchTask(task.id, { status: event.target.value })}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white disabled:opacity-60"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>

                <select
                  value={task.priority}
                  disabled={!canManage || busyTaskId === task.id}
                  onChange={(event) => void patchTask(task.id, { priority: event.target.value })}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white disabled:opacity-60"
                >
                  {PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>

                <select
                  value={task.assigned_email || ''}
                  disabled={!canManage || busyTaskId === task.id}
                  onChange={(event) => void patchTask(task.id, { assignedEmail: event.target.value })}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white disabled:opacity-60"
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((email) => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>

                <input
                  value={task.due_date || ''}
                  type="date"
                  disabled={!canManage || busyTaskId === task.id}
                  onChange={(event) => void patchTask(task.id, { dueDate: event.target.value })}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white disabled:opacity-60"
                />
              </div>
              ) : canUpdateStageOnly ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <select
                    value={task.status}
                    disabled={busyTaskId === task.id}
                    onChange={(event) => void patchTask(task.id, { status: event.target.value })}
                    className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void patchTask(task.id, { status: 'done' })}
                    disabled={busyTaskId === task.id || task.status === 'done'}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60"
                  >
                    Mark Completed
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">You can update stage only.</p>
                </div>
              ) : (
                <div className="text-xs text-gray-500 dark:text-gray-400">Read only.</div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned to: {task.assigned_email || 'Unassigned'}</p>
                {canEditAll && (
                  <button
                    type="button"
                    onClick={() => void deleteTask(task.id)}
                    disabled={busyTaskId === task.id}
                    className="rounded-xl border border-red-200 dark:border-red-900/50 px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-red-700 dark:text-red-300 disabled:opacity-60"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/50 p-3 space-y-2" >
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">Comments</p>
                {taskComments.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No comments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {taskComments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5">
                        <p className="text-xs text-black dark:text-white whitespace-pre-wrap break-words">{comment.text}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{comment.author_email}</p>
                      </div>
                    ))}
                  </div>
                )}

                {canCommentOnTask && (
                  <div className="mt-2 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={commentDrafts[task.id] || ''}
                      onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [task.id]: event.target.value }))}
                      placeholder="Add a comment"
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => void addComment(task.id)}
                      disabled={commentSavingTaskId === task.id}
                      className="rounded-xl bg-black dark:bg-white text-white dark:text-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
                    >
                      Add Comment
                    </button>
                  </div>
                )}
              </div>
                  </>
                )
              })()}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
