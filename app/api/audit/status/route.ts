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
          set(name: string, value: string) {
            try {
              (cookieStore as any).set?.({ name, value })
            } catch {
            }
          },
          remove(name: string) {
            try {
              (cookieStore as any).delete?.({ name })
            } catch {
            }
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
      .select('status')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .maybeSingle()

    const data = statusOnly.data as { status: string } | null
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

    return new Response(JSON.stringify({ status: data.status, error: errorMessage }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 })
  }
}
