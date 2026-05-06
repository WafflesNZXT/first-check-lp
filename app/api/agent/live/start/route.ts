import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function POST(req: Request) {
  try {
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const auditId = String(body?.auditId || '').trim()
    const targetUrl = String(body?.targetUrl || body?.url || '').trim()

    if (!auditId || !targetUrl) {
      return NextResponse.json({ error: 'Missing auditId or targetUrl' }, { status: 400 })
    }

    const { data: audit } = await supabase
      .from('audits')
      .select('id,user_id,website_url')
      .eq('id', auditId)
      .maybeSingle()

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    const isOwner = String((audit as { user_id?: string }).user_id || '') === user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const { data: session, error: sessionError } = await supabase
      .from('agent_sessions')
      .insert([
        {
          audit_id: auditId,
          user_id: user.id,
          target_url: targetUrl,
          current_url: targetUrl,
          status: 'queued',
          mode: 'browser_worker',
          started_at: now,
        },
      ])
      .select('id,audit_id,user_id,target_url,status,mode,current_url,summary,error_message,started_at,finished_at,created_at,updated_at')
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Failed to create agent session' }, { status: 500 })
    }

    const workerBase = String(process.env.LIVE_AGENT_WORKER_URL || 'http://127.0.0.1:8001').replace(/\/$/, '')

    try {
      const workerResponse = await fetch(`${workerBase}/run-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          audit_id: auditId,
          user_id: user.id,
          target_url: targetUrl,
        }),
      })

      if (!workerResponse.ok) {
        throw new Error(`Worker returned ${workerResponse.status}`)
      }
    } catch (error) {
      await supabase
        .from('agent_sessions')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Could not reach live agent worker',
          finished_at: new Date().toISOString(),
        })
        .eq('id', session.id)
        .eq('user_id', user.id)

      return NextResponse.json(
        {
          error: 'Could not reach live agent worker. Start it with .\\.venv\\Scripts\\python.exe .\\audo-core\\live_agent_worker.py',
          session,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ session })
  } catch {
    return NextResponse.json({ error: 'Failed to start live agent' }, { status: 500 })
  }
}
