import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type TaskContext = {
  role: 'creator' | 'assignee' | 'none'
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

async function getTaskContext(supabase: Awaited<ReturnType<typeof getSupabase>>, taskId: string, userId: string, userEmail: string | null): Promise<TaskContext> {
  const { data: task } = await supabase
    .from('audit_workflow_tasks')
    .select('id, created_by_user_id, assigned_email')
    .eq('id', taskId)
    .maybeSingle()

  if (!task) {
    return { role: 'none' }
  }

  if (String((task as { created_by_user_id?: string }).created_by_user_id || '') === userId) {
    return { role: 'creator' }
  }

  const normalizedUserEmail = String(userEmail || '').trim().toLowerCase()
  const normalizedAssigned = String((task as { assigned_email?: string | null }).assigned_email || '').trim().toLowerCase()
  if (normalizedUserEmail && normalizedAssigned && normalizedUserEmail === normalizedAssigned) {
    return { role: 'assignee' }
  }

  return { role: 'none' }
}

export async function GET(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
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
    if (taskContext.role === 'none') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('audit_workflow_task_comments')
      .select('id, task_id, text, author_email, created_at')
      .eq('task_id', cleanTaskId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
    }

    return NextResponse.json({ comments: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ taskId: string }> }) {
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
    if (taskContext.role === 'none') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const text = String(body?.text || '').trim()
    if (!text) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('audit_workflow_task_comments')
      .insert([
        {
          task_id: cleanTaskId,
          text,
          author_email: String(currentUser.email || '').trim().toLowerCase() || 'unknown@user',
        },
      ])
      .select('id, task_id, text, author_email, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
    }

    return NextResponse.json({ comment: data })
  } catch {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
