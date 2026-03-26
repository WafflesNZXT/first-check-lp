import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { auditId } = await req.json()
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value) { try { (cookieStore as any).set?.({ name, value }) } catch (e) {} },
          remove(name) { try { (cookieStore as any).delete?.(name) } catch (e) {} }
        }
      }
    )

    const getUser = await supabase.auth.getUser()
    const user = getUser.data.user
    if (!user) return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 })

    const { error } = await supabase
      .from('audits')
      .update({ status: 'cancelled' })
      .eq('id', auditId)

    if (error) {
      console.error('cancel audit error', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err: any) {
    console.error('audit cancel error', err?.message ?? err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
