import { ImageResponse } from 'next/og'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import React from 'react'

type Params = {
  params: Promise<{ id: string }> | { id: string }
}

function toSafeScore(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

export async function GET(_req: Request, { params }: Params) {
  const resolved = await params
  const auditId = resolved.id

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

  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: audit } = await supabase
    .from('audits')
    .select('id, website_url, seo_score, performance_score')
    .eq('id', auditId)
    .maybeSingle()

  if (!audit) {
    return new Response('Not Found', { status: 404 })
  }

  const seo = toSafeScore((audit as { seo_score?: number | null }).seo_score)
  const perf = toSafeScore((audit as { performance_score?: number | null }).performance_score)
  const site = String((audit as { website_url?: string | null }).website_url || 'Website Audit')

  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000000',
          color: '#ffffff',
          padding: '56px',
          fontFamily: 'Inter, Arial, sans-serif',
        },
      },
      React.createElement(
        'div',
        { style: { display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8 } },
        'audo audit snapshot'
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 18 } },
        React.createElement(
          'div',
          { style: { display: 'flex', fontSize: 44, fontWeight: 800, lineHeight: 1.1 } },
          site
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', gap: 72 } },
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column' } },
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 20, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 1.2 } },
              'Performance'
            ),
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 164, fontWeight: 900, lineHeight: 0.9 } },
              String(perf)
            )
          ),
          React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column' } },
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 20, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 1.2 } },
              'SEO'
            ),
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 164, fontWeight: 900, lineHeight: 0.9 } },
              String(seo)
            )
          )
        )
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', fontSize: 18, opacity: 0.7 } },
        'useaudo.com'
      )
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
