import { getServerSupabase } from '@/utils/supabase/server'

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

    const supabase = await getServerSupabase()

    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) {
      return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 })
    }

    const readStatus = (columns: string) => supabase
      .from('audits')
      .select(columns)
      .eq('id', auditId)
      .eq('user_id', user.id)
      .maybeSingle()

    const statusWithProgress = await readStatus('status,error_message,report_content')
    const statusResult = isMissingColumnError(statusWithProgress.error, 'error_message')
      ? await readStatus('status,report_content')
      : statusWithProgress

    const data = statusResult.data as unknown as {
      status: string
      error_message?: string | null
      report_content?: {
        agent_supplement?: {
          ok?: boolean
          status_label?: string
          model?: string
        } | null
      } | null
    } | null
    const error = statusResult.error

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

    const message = typeof data.error_message === 'string' ? data.error_message : null
    const hasFailed = data.status === 'failed' || data.status === 'cancelled'

    return new Response(
      JSON.stringify({
        status: data.status,
        error: hasFailed ? message : null,
        progress_message: hasFailed ? null : message,
        agent: data?.report_content?.agent_supplement
          ? {
              ok: Boolean(data.report_content.agent_supplement.ok),
              status: String(data.report_content.agent_supplement.status_label || ''),
              model: String(data.report_content.agent_supplement.model || ''),
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
