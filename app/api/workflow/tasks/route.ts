import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type AccessInfo = {
  canView: boolean
  canManage: boolean
}

type WorkflowComment = {
  id: string
  task_id: string
  text: string
  author_email: string
  created_at: string
}

type TaskStatus = 'open' | 'in_progress' | 'in_review' | 'done' | 'wont_fix'
type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

const VALID_STATUSES: TaskStatus[] = ['open', 'in_progress', 'in_review', 'done', 'wont_fix']
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'critical']

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

async function getAccessInfo(supabase: Awaited<ReturnType<typeof getSupabase>>, auditId: string, userId: string, userEmail: string | null): Promise<AccessInfo> {
  const { data: audit } = await supabase
    .from('audits')
    .select('id, user_id')
    .eq('id', auditId)
    .maybeSingle()

  if (!audit) {
    return { canView: false, canManage: false }
  }

  const isOwner = String(audit.user_id) === userId
  if (isOwner) {
    return { canView: true, canManage: true }
  }

  if (!userEmail) {
    return { canView: false, canManage: false }
  }

  const { data: shareRow } = await supabase
    .from('audit_shares')
    .select('access_level')
    .eq('audit_id', auditId)
    .eq('shared_with_email', userEmail.toLowerCase())
    .maybeSingle()

  const accessLevel = String((shareRow as { access_level?: string } | null)?.access_level || '').toLowerCase()
  const canView = accessLevel === 'view' || accessLevel === 'edit'
  const canManage = accessLevel === 'edit'

  return { canView, canManage }
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

export async function GET(req: Request) {
  try {
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData.user

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const auditId = String(searchParams.get('auditId') || '').trim()
    if (!auditId) {
      return NextResponse.json({ error: 'Missing auditId' }, { status: 400 })
    }

    const accessInfo = await getAccessInfo(supabase, auditId, currentUser.id, currentUser.email ?? null)
    if (!accessInfo.canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const normalizedEmail = String(currentUser.email || '').trim().toLowerCase()
    let tasksQuery = supabase
      .from('audit_workflow_tasks')
      .select('id, audit_id, title, notes, source_issue, status, priority, assigned_email, due_date, created_by_user_id, created_at, updated_at')
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false })

    if (normalizedEmail) {
      tasksQuery = tasksQuery.or(`created_by_user_id.eq.${currentUser.id},assigned_email.eq.${normalizedEmail}`)
    } else {
      tasksQuery = tasksQuery.eq('created_by_user_id', currentUser.id)
    }

    const { data, error } = await tasksQuery

    if (error) {
      return NextResponse.json({ error: 'Failed to load workflow tasks' }, { status: 500 })
    }

    const taskIds = (data || []).map((task) => String((task as { id?: string }).id || '')).filter(Boolean)

    let comments: WorkflowComment[] = []
    if (taskIds.length > 0) {
      const { data: commentRows } = await supabase
        .from('audit_workflow_task_comments')
        .select('id, task_id, text, author_email, created_at')
        .in('task_id', taskIds)
        .order('created_at', { ascending: true })

      comments = Array.isArray(commentRows) ? (commentRows as WorkflowComment[]) : []
    }

    return NextResponse.json({ tasks: data || [], comments, canManage: accessInfo.canManage })
  } catch {
    return NextResponse.json({ error: 'Failed to load workflow tasks' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const currentUser = authData.user

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const auditId = String(body?.auditId || '').trim()
    const title = String(body?.title || '').trim()
    const notes = String(body?.notes || '').trim()
    const sourceIssue = String(body?.sourceIssue || '').trim()
    const assignedEmailRaw = String(body?.assignedEmail || '').trim().toLowerCase()
    const dueDateRaw = String(body?.dueDate || '').trim()
    const statusRaw = String(body?.status || 'open').trim().toLowerCase() as TaskStatus
    const priorityRaw = String(body?.priority || 'medium').trim().toLowerCase() as TaskPriority

    if (!auditId || !title) {
      return NextResponse.json({ error: 'Missing auditId or title' }, { status: 400 })
    }

    if (!VALID_STATUSES.includes(statusRaw) || !VALID_PRIORITIES.includes(priorityRaw)) {
      return NextResponse.json({ error: 'Invalid status or priority' }, { status: 400 })
    }

    const accessInfo = await getAccessInfo(supabase, auditId, currentUser.id, currentUser.email ?? null)
    if (!accessInfo.canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (assignedEmailRaw) {
      const invited = await isInvitedDeveloper(supabase, auditId, assignedEmailRaw)
      if (!invited) {
        return NextResponse.json({ error: 'Assignee must be an invited developer' }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('audit_workflow_tasks')
      .insert([
        {
          audit_id: auditId,
          title,
          notes: notes || null,
          source_issue: sourceIssue || null,
          status: statusRaw,
          priority: priorityRaw,
          assigned_email: assignedEmailRaw || null,
          due_date: dueDateRaw || null,
          created_by_user_id: currentUser.id,
        },
      ])
      .select('id, audit_id, title, notes, source_issue, status, priority, assigned_email, due_date, created_by_user_id, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create workflow task' }, { status: 500 })
    }

    return NextResponse.json({ task: data })
  } catch {
    return NextResponse.json({ error: 'Failed to create workflow task' }, { status: 500 })
  }
}
