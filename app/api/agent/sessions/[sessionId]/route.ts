import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const VALID_STATUSES = new Set(['queued', 'running', 'completed', 'failed', 'cancelled'])

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

export async function PATCH(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const status = String(body?.status || '').toLowerCase()
    const summary = String(body?.summary || '').trim()
    const errorMessage = String(body?.errorMessage || '').trim()
    const currentUrl = String(body?.currentUrl || '').trim()

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const patch: Record<string, unknown> = { status }
    if (summary) patch.summary = summary
    if (errorMessage) patch.error_message = errorMessage
    if (currentUrl) patch.current_url = currentUrl
    if (status === 'running') patch.started_at = new Date().toISOString()
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      patch.finished_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('agent_sessions')
      .update(patch)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select('id,audit_id,user_id,target_url,status,mode,current_url,summary,error_message,started_at,finished_at,created_at,updated_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update agent session' }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch {
    return NextResponse.json({ error: 'Failed to update agent session' }, { status: 500 })
  }
}
