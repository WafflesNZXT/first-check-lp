import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type AgentSessionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
const AGENT_SESSION_SELECT = 'id,audit_id,user_id,target_url,status,mode,current_url,live_view_url,replay_url,worker_id,last_heartbeat_at,summary,error_message,started_at,finished_at,created_at,updated_at'

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

function normalizeStatus(value: unknown): AgentSessionStatus {
  const status = String(value || '').toLowerCase()
  if (status === 'queued' || status === 'running' || status === 'completed' || status === 'failed' || status === 'cancelled') {
    return status
  }
  return 'queued'
}

export async function GET(req: Request) {
  try {
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const auditId = String(searchParams.get('auditId') || '').trim()
    if (!auditId) {
      return NextResponse.json({ error: 'Missing auditId' }, { status: 400 })
    }

    const { data: audit } = await supabase
      .from('audits')
      .select('id,user_id')
      .eq('id', auditId)
      .maybeSingle()

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    const isOwner = String((audit as { user_id?: string }).user_id || '') === user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('agent_sessions')
      .select(AGENT_SESSION_SELECT)
      .eq('audit_id', auditId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({ error: 'Failed to load agent sessions' }, { status: 500 })
    }

    return NextResponse.json({ sessions: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to load agent sessions' }, { status: 500 })
  }
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
    const status = normalizeStatus(body?.status || 'queued')

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
    const { data, error } = await supabase
      .from('agent_sessions')
      .insert([
        {
          audit_id: auditId,
          user_id: user.id,
          target_url: targetUrl,
          current_url: targetUrl,
          status,
          mode: 'preview',
          started_at: status === 'running' ? now : null,
        },
      ])
      .select(AGENT_SESSION_SELECT)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create agent session' }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch {
    return NextResponse.json({ error: 'Failed to create agent session' }, { status: 500 })
  }
}
