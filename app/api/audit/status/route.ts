import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function isMissingColumnError(error: unknown, columnName: string) {
  const message = String((error as { message?: string })?.message || '').toLowerCase()
  return message.includes(columnName.toLowerCase()) && (
    message.includes('column')
    || message.includes('does not exist')
    || message.includes('could not find')
  )
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const auditId = searchParams.get('id')
    if (!auditId) {
      return new Response(JSON.stringify({ error: 'missing_audit_id' }), { status: 400 })
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(_name: string, _value: string) {
            void _name
            void _value
          },
          remove(_name: string) {
            void _name
          },
        },
      }
    )

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 })
    }

    const statusOnly = await supabase
      .from('audits')
      .select('status,error_message,report_content')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .maybeSingle()

    const data = statusOnly.data as {
      status: string
      error_message?: string | null
      report_content?: {
        agent_supplement?: {
          ok?: boolean
          status_label?: string
          model?: string
          db_log?: {
            saved?: boolean
            reason?: string
            status_code?: number
            error?: string
          } | null
        } | null
      } | null
    } | null
    const error = statusOnly.error

    if (error) {
      return new Response(
        JSON.stringify({ status: 'processing', error: 'pending_status', retry: true }),
        { status: 200 }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ status: 'processing', error: 'pending_visibility', retry: true }),
        { status: 200 }
      )
    }

    const progressMessage = typeof data?.error_message === 'string' ? data.error_message : null
    let errorMessage: string | null = null
    if (data.status === 'failed' || data.status === 'cancelled') {
      const withErrorMessage = await supabase
        .from('audits')
        .select('error_message')
        .eq('id', auditId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!withErrorMessage.error && withErrorMessage.data) {
        const value = (withErrorMessage.data as { error_message?: string | null }).error_message
        errorMessage = typeof value === 'string' ? value : null
      } else if (withErrorMessage.error && !isMissingColumnError(withErrorMessage.error, 'error_message')) {
        errorMessage = null
      }
    }

    return new Response(
      JSON.stringify({
        status: data.status,
        error: errorMessage,
        progress_message: progressMessage,
        agent: data?.report_content?.agent_supplement
          ? {
              ok: Boolean(data.report_content.agent_supplement.ok),
              status: String(data.report_content.agent_supplement.status_label || ''),
              model: String(data.report_content.agent_supplement.model || ''),
              db_saved: Boolean(data.report_content.agent_supplement.db_log?.saved),
              db_reason: String(data.report_content.agent_supplement.db_log?.reason || data.report_content.agent_supplement.db_log?.error || ''),
            }
          : null,
      }),
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = typeof err === 'object' && err && 'message' in err
      ? String((err as { message?: unknown }).message || err)
      : String(err)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}
