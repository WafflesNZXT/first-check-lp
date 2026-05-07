import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const AGENT_SESSION_SELECT = 'id,audit_id,user_id,target_url,status,mode,current_url,live_view_url,replay_url,worker_id,last_heartbeat_at,summary,error_message,started_at,finished_at,created_at,updated_at'
const SETUP_MESSAGE = 'Live agent database setup is not applied yet. Run supabase/agent_sessions.sql in Supabase SQL editor, then try again.'

function isSchemaSetupError(error: unknown) {
  const message = String((error as { message?: unknown })?.message || error || '').toLowerCase()
  return (
    message.includes('agent_jobs') ||
    message.includes('live_view_url') ||
    message.includes('replay_url') ||
    message.includes('worker_id') ||
    message.includes('last_heartbeat_at') ||
    message.includes('schema cache') ||
    message.includes('could not find') ||
    message.includes('does not exist')
  )
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
      .select(AGENT_SESSION_SELECT)
      .single()

    if (sessionError || !session) {
      console.error('Live agent session create failed', sessionError)
      return NextResponse.json(
        {
          error: isSchemaSetupError(sessionError) ? SETUP_MESSAGE : 'Failed to create agent session',
          details: sessionError?.message,
        },
        { status: 500 }
      )
    }

    const { data: job, error: jobError } = await supabase
      .from('agent_jobs')
      .insert([
        {
          session_id: session.id,
          audit_id: auditId,
          user_id: user.id,
          target_url: targetUrl,
          status: 'queued',
          metadata: { source: 'dashboard' },
        },
      ])
      .select('id')
      .single()

    if (jobError || !job) {
      console.error('Live agent job queue failed', jobError)
      await supabase
        .from('agent_sessions')
        .update({
          status: 'failed',
          error_message: 'Could not queue the live agent run.',
          finished_at: new Date().toISOString(),
        })
        .eq('id', session.id)
        .eq('user_id', user.id)

      return NextResponse.json(
        {
          error: isSchemaSetupError(jobError) ? SETUP_MESSAGE : 'Could not queue the live agent run.',
          details: jobError.message,
          session,
        },
        { status: 500 }
      )
    }

    const { error: eventError } = await supabase
      .from('agent_events')
      .insert([
        {
          session_id: session.id,
          audit_id: auditId,
          user_id: user.id,
          event_type: 'status',
          message: 'Live agent queued. A hosted browser worker will pick up this run automatically.',
          current_url: targetUrl,
          cursor_x: 12,
          cursor_y: 14,
          scroll_y: 0,
          metadata: { source: 'dashboard', queued: true },
        },
      ])

    if (eventError) {
      console.error('Live agent queued event failed', eventError)
    }

    const workerBase = String(process.env.LIVE_AGENT_WORKER_URL || '').replace(/\/$/, '')

    if (workerBase) {
      let directClaimed = false
      try {
        const { data: claimedJob, error: claimError } = await supabase
          .from('agent_jobs')
          .update({
            status: 'claimed',
            worker_id: 'direct-dispatch',
            claimed_at: new Date().toISOString(),
          })
          .eq('id', job.id)
          .eq('user_id', user.id)
          .eq('status', 'queued')
          .select('id')
          .maybeSingle()

        if (claimError || !claimedJob) {
          throw new Error(claimError?.message || 'The queued job was already claimed by a polling worker.')
        }

        directClaimed = true

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const workerToken = process.env.LIVE_AGENT_WORKER_TOKEN
        if (workerToken) headers.Authorization = `Bearer ${workerToken}`

        const workerResponse = await fetch(`${workerBase}/run-session`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: session.id,
            audit_id: auditId,
            user_id: user.id,
            target_url: targetUrl,
            job_id: job.id,
          }),
        })

        if (!workerResponse.ok) {
          throw new Error(`Worker returned ${workerResponse.status}`)
        }
      } catch (error) {
        if (!directClaimed) {
          return NextResponse.json({ session, queued: true, workerAccepted: false, dispatchSkipped: true })
        }

        if (directClaimed) {
          await supabase
            .from('agent_jobs')
            .update({
              status: 'queued',
              worker_id: null,
              claimed_at: null,
              error_message: error instanceof Error ? `Direct dispatch failed: ${error.message}` : 'Direct dispatch failed.',
            })
            .eq('id', job.id)
            .eq('user_id', user.id)
            .eq('worker_id', 'direct-dispatch')
            .in('status', ['claimed', 'queued'])
        }

        await supabase
          .from('agent_sessions')
          .update({
            error_message: error instanceof Error ? `Queued, but the worker did not accept the run yet: ${error.message}` : 'Queued, but the worker did not accept the run yet.',
          })
          .eq('id', session.id)
          .eq('user_id', user.id)

        return NextResponse.json({ session, queued: true, workerAccepted: false })
      }
    }

    return NextResponse.json({ session, queued: true, workerAccepted: Boolean(workerBase) })
  } catch (error) {
    console.error('Live agent start failed', error)
    return NextResponse.json({ error: 'Failed to start live agent' }, { status: 500 })
  }
}
