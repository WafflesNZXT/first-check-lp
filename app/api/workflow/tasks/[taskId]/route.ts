import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type TaskStatus = 'open' | 'in_progress' | 'in_review' | 'done' | 'wont_fix'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

const VALID_STATUSES: TaskStatus[] = ['open', 'in_progress', 'in_review', 'done', 'wont_fix']
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical']

type TaskContext = {
  role: 'creator' | 'assignee' | 'none'
  auditId: string | null
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

async function isInvitedDeveloper(supabase: Awaited<ReturnType<typeof getSupabase>>, auditId: string, email: string) {
  const { data } = await supabase
    .from('audit_shares')
    .select('shared_with_email')
    .eq('audit_id', auditId)
    .eq('shared_with_email', email)
    .maybeSingle()

  return !!data
}

async function getTaskContext(supabase: Awaited<ReturnType<typeof getSupabase>>, taskId: string, userId: string, userEmail: string | null): Promise<TaskContext> {
  const { data: task } = await supabase
    .from('audit_workflow_tasks')
    .select('id, audit_id, created_by_user_id, assigned_email')
    .eq('id', taskId)
    .maybeSingle()

  if (!task) {
    return { role: 'none', auditId: null }
  }

  const auditId = String(task.audit_id)
  if (String((task as { created_by_user_id?: string }).created_by_user_id || '') === userId) {
    return { role: 'creator', auditId }
  }

  const normalizedUserEmail = String(userEmail || '').trim().toLowerCase()
  const normalizedAssigned = String((task as { assigned_email?: string | null }).assigned_email || '').trim().toLowerCase()
  if (normalizedUserEmail && normalizedAssigned && normalizedUserEmail === normalizedAssigned) {
    return { role: 'assignee', auditId }
  }

  return { role: 'none', auditId }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData.user
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params
    const cleanTaskId = String(taskId || '').trim()
    if (!cleanTaskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    const taskContext = await getTaskContext(supabase, cleanTaskId, currentUser.id, currentUser.email ?? null)
    if (!taskContext.auditId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    if (taskContext.role === 'none') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const patch: Record<string, string | null> = {}

    if (taskContext.role === 'assignee') {
      const patchKeys = Object.keys(body || {})
      const onlyStatus = patchKeys.length === 1 && patchKeys[0] === 'status'
      if (!onlyStatus) {
        return NextResponse.json({ error: 'Assignees can only update task stage' }, { status: 403 })
      }
    }

    if (body?.title !== undefined) {
      if (taskContext.role !== 'creator') {
        return NextResponse.json({ error: 'Only task creator can edit title' }, { status: 403 })
      }
      const title = String(body.title || '').trim()
      if (!title) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      patch.title = title
    }

    if (body?.notes !== undefined) {
      if (taskContext.role !== 'creator') {
        return NextResponse.json({ error: 'Only task creator can edit notes' }, { status: 403 })
      }
      const notes = String(body.notes || '').trim()
      patch.notes = notes || null
    }

    if (body?.sourceIssue !== undefined) {
      if (taskContext.role !== 'creator') {
        return NextResponse.json({ error: 'Only task creator can edit source issue' }, { status: 403 })
      }
      const sourceIssue = String(body.sourceIssue || '').trim()
      patch.source_issue = sourceIssue || null
    }

    if (body?.assignedEmail !== undefined) {
      if (taskContext.role !== 'creator') {
        return NextResponse.json({ error: 'Only task creator can edit assignee' }, { status: 403 })
      }
      const assignedEmail = String(body.assignedEmail || '').trim().toLowerCase()
      if (assignedEmail) {
        const invited = await isInvitedDeveloper(supabase, String(taskContext.auditId), assignedEmail)
        if (!invited) {
          return NextResponse.json({ error: 'Assignee must be an invited developer' }, { status: 400 })
        }
      }
      patch.assigned_email = assignedEmail || null
    }

    if (body?.dueDate !== undefined) {
      if (taskContext.role !== 'creator') {
        return NextResponse.json({ error: 'Only task creator can edit due date' }, { status: 403 })
      }
      const dueDate = String(body.dueDate || '').trim()
      patch.due_date = dueDate || null
    }

    if (body?.status !== undefined) {
      const status = String(body.status || '').trim().toLowerCase() as TaskStatus
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      patch.status = status
    }

    if (body?.priority !== undefined) {
      if (taskContext.role !== 'creator') {
        return NextResponse.json({ error: 'Only task creator can edit priority' }, { status: 403 })
      }
      const priority = String(body.priority || '').trim().toLowerCase() as TaskPriority
      if (!VALID_PRIORITIES.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
      }
      patch.priority = priority
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('audit_workflow_tasks')
      .update(patch)
      .eq('id', cleanTaskId)
      .select('id, audit_id, title, notes, source_issue, status, priority, assigned_email, due_date, created_by_user_id, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update workflow task' }, { status: 500 })
    }

    return NextResponse.json({ task: data })
  } catch {
    return NextResponse.json({ error: 'Failed to update workflow task' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData.user
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await params
    const cleanTaskId = String(taskId || '').trim()
    if (!cleanTaskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    const taskContext = await getTaskContext(supabase, cleanTaskId, currentUser.id, currentUser.email ?? null)
    if (!taskContext.auditId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    if (taskContext.role !== 'creator') {
      return NextResponse.json({ error: 'Only task creator can remove task' }, { status: 403 })
    }

    const { error } = await supabase
      .from('audit_workflow_tasks')
      .delete()
      .eq('id', cleanTaskId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete workflow task' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete workflow task' }, { status: 500 })
  }
}
