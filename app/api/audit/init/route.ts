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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('read profile error', profileError)
      return new Response(JSON.stringify({ error: 'Unable to verify subscription. Please try again.' }), { status: 500 })
    }

    const isPro = profile?.plan_type === 'pro' || profile?.plan_type === 'admin'

    if (!isPro) {
      const { count, error: countError } = await supabase
        .from('audits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) {
        console.error('count audits error', countError)
        return new Response(JSON.stringify({ error: 'Unable to verify audit limit. Please try again.' }), { status: 500 })
      }

      if ((count ?? 0) >= 3) {
        return new Response(
          JSON.stringify({ error: 'Free plan limit reached. You can run up to 3 audits total. Upgrade to Pro to continue.' }),
          { status: 403 }
        )
      }
    }

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
