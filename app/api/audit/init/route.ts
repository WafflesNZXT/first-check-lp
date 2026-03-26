import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string) {
            try { (cookieStore as any).set?.({ name, value }) } catch (e) { }
          },
          remove(name: string) {
            try { (cookieStore as any).delete?.(name) } catch (e) { }
          }
        },
      }
    )

    const getUser = await supabase.auth.getUser()
    const user = getUser.data.user
    if (!user) return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 })

    const { data, error } = await supabase
      .from('audits')
      .insert([{ user_id: user.id, website_url: url, status: 'processing' }])
      .select()

    if (error) {
      console.error('insert audit error', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    const newAudit = data?.[0]
    return new Response(JSON.stringify({ id: newAudit?.id }), { status: 200 })
  } catch (err: any) {
    console.error('audit init error', err?.message ?? err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
