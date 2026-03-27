import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    const withErrorMessage = await supabase
      .from('audits')
      .select('status, error_message')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .maybeSingle()

    let data = withErrorMessage.data as { status: string; error_message?: string | null } | null
    let error = withErrorMessage.error

    if (error && String(error.message || '').toLowerCase().includes("could not find the 'error_message' column")) {
      const statusOnly = await supabase
        .from('audits')
        .select('status')
        .eq('id', auditId)
        .eq('user_id', user.id)
        .maybeSingle()

      data = statusOnly.data as { status: string } | null
      error = statusOnly.error
    }

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 })
    }

    return new Response(JSON.stringify({ status: data.status, error: data.error_message ?? null }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), { status: 500 })
  }
}
