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

    const { data: profile, error: profileReadError } = await supabase
      .from('profiles')
      .select('audit_count')
      .eq('id', user.id)
      .maybeSingle()

    if (profileReadError) {
      console.warn('read profile audit_count error', profileReadError)
    } else {
      const nextAuditCount = (profile?.audit_count ?? 0) + 1
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ audit_count: nextAuditCount })
        .eq('id', user.id)

      if (profileUpdateError) {
        console.warn('update profile audit_count error', profileUpdateError)
      }
    }

    const newAudit = data?.[0]
    return new Response(JSON.stringify({ id: newAudit?.id }), { status: 200 })
  } catch (err: any) {
    console.error('audit init error', err?.message ?? err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
