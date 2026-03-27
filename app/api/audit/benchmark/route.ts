import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function normalizeHostname(value: string) {
  const input = value.trim()
  if (!input) return ''

  try {
    const withProtocol = input.startsWith('http') ? input : `https://${input}`
    return new URL(withProtocol).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return input.toLowerCase().replace(/^www\./, '')
  }
}

export async function POST(req: Request) {
  try {
    const { competitorUrl } = await req.json()
    const targetHostname = normalizeHostname(String(competitorUrl || ''))

    if (!targetHostname) {
      return new Response(JSON.stringify({ error: 'Please provide a valid competitor URL.' }), { status: 400 })
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
              ;(cookieStore as any).set?.({ name, value })
            } catch {
            }
          },
          remove(name: string) {
            try {
              ;(cookieStore as any).delete?.({ name })
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

    const { data, error } = await supabase
      .from('audits')
      .select('id, website_url, performance_score, ux_score, seo_score, status, is_public, user_id, created_at')
      .eq('status', 'completed')
      .or(`is_public.eq.true,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(120)

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }

    const match = (data || []).find((row) => {
      const rowHost = normalizeHostname(String(row.website_url || ''))
      return rowHost === targetHostname
    })

    if (!match) {
      return new Response(JSON.stringify({ error: 'No completed competitor audit found yet. Run an audit for that URL first (or make it public).' }), { status: 404 })
    }

    return new Response(
      JSON.stringify({
        competitor: {
          website_url: match.website_url,
          performance_score: match.performance_score ?? 0,
          ux_score: match.ux_score ?? 0,
          seo_score: match.seo_score ?? 0,
        },
      }),
      { status: 200 }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: String(error?.message || error) }), { status: 500 })
  }
}
