import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const flow = searchParams.get('flow')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') ? rawNext : '/dashboard'

  const sendToSignIn = (reason: string) => {
    const target = `${origin}/signin?next=${encodeURIComponent(next)}&auth=${encodeURIComponent(reason)}`
    return NextResponse.redirect(target)
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    if (flow === 'oauth') {
      const message = String(error.message || '').toLowerCase()
      if (message.includes('invalid_grant') || message.includes('code verifier') || message.includes('already used')) {
        return sendToSignIn('oauth_code_used')
      }
      return sendToSignIn('oauth_failed')
    }

    return sendToSignIn('expired_link')
  }

  if (flow === 'oauth') {
    return sendToSignIn('oauth_missing_code')
  }

  return sendToSignIn('missing_code')
}