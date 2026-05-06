import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const VALID_EVENT_TYPES = new Set(['status', 'navigate', 'scroll', 'click', 'input', 'finding', 'screenshot', 'code_scan', 'complete', 'error'])
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical'])

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

function toOptionalNumber(value: unknown) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export async function GET(_req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: session } = await supabase
      .from('agent_sessions')
      .select('id,user_id')
      .eq('id', sessionId)
      .maybeSingle()

    if (!session || String((session as { user_id?: string }).user_id || '') !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('agent_events')
      .select('id,session_id,audit_id,user_id,event_type,message,current_url,cursor_x,cursor_y,scroll_y,screenshot_url,severity,metadata,created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
    }

    return NextResponse.json({ events: data || [] })
  } catch {
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const supabase = await getSupabase()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: session } = await supabase
      .from('agent_sessions')
      .select('id,audit_id,user_id')
      .eq('id', sessionId)
      .maybeSingle()

    if (!session || String((session as { user_id?: string }).user_id || '') !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const eventType = String(body?.eventType || body?.event_type || '').trim().toLowerCase()
    const message = String(body?.message || '').trim()
    const severityRaw = String(body?.severity || '').trim().toLowerCase()

    if (!VALID_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('agent_events')
      .insert([
        {
          session_id: sessionId,
          audit_id: (session as { audit_id: string }).audit_id,
          user_id: user.id,
          event_type: eventType,
          message,
          current_url: String(body?.currentUrl || body?.current_url || '').trim() || null,
          cursor_x: toOptionalNumber(body?.cursorX ?? body?.cursor_x),
          cursor_y: toOptionalNumber(body?.cursorY ?? body?.cursor_y),
          scroll_y: toOptionalNumber(body?.scrollY ?? body?.scroll_y),
          screenshot_url: String(body?.screenshotUrl || body?.screenshot_url || '').trim() || null,
          severity: VALID_SEVERITIES.has(severityRaw) ? severityRaw : null,
          metadata: body?.metadata && typeof body.metadata === 'object' ? body.metadata : {},
        },
      ])
      .select('id,session_id,audit_id,user_id,event_type,message,current_url,cursor_x,cursor_y,scroll_y,screenshot_url,severity,metadata,created_at')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ event: data })
  } catch {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}
