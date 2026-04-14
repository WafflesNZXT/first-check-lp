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
          background: 'linear-gradient(135deg, #0b1020 0%, #111827 40%, #172554 100%)',
          color: '#ffffff',
          padding: '46px',
          fontFamily: 'Inter, Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        },
      },
      React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            top: '-100px',
            right: '-120px',
            width: '420px',
            height: '420px',
            borderRadius: '999px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.42) 0%, rgba(59,130,246,0.1) 45%, rgba(59,130,246,0) 72%)',
          },
        }
      ),
      React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            bottom: '-150px',
            left: '-90px',
            width: '420px',
            height: '420px',
            borderRadius: '999px',
            background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(56,189,248,0.08) 40%, rgba(56,189,248,0) 72%)',
          },
        }
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          },
        },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 14 } },
          React.createElement(
            'svg',
            {
              width: 46,
              height: 46,
              viewBox: '0 0 64 64',
              fill: 'none',
              xmlns: 'http://www.w3.org/2000/svg',
            },
            React.createElement('path', { d: 'M4 20L32 4L60 20V30L32 14L4 30V20Z', fill: '#3B82F6' }),
            React.createElement('path', { d: 'M4 34L32 18L60 34V44L32 28L4 44V34Z', fill: '#3B82F6' }),
            React.createElement('path', { d: 'M4 48L32 32L60 48L44 58L32 50L20 58L4 48Z', fill: '#3B82F6' })
          ),
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: '-1.2px',
                lineHeight: 1,
              },
            },
            'audo'
          )
        ),
        React.createElement(
          'div',
          {
            style: {
              display: 'flex',
              padding: '10px 16px',
              borderRadius: '999px',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.55)',
              fontSize: 16,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1.3,
              color: '#dbeafe',
            },
          },
          'Audit Snapshot'
        )
      ),
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: 16, width: '100%' } },
        React.createElement(
          'div',
          { style: { display: 'flex', fontSize: 22, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase', letterSpacing: 1.2, color: '#93c5fd' } },
          'Website'
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', fontSize: 58, fontWeight: 900, lineHeight: 1.05, maxWidth: '1020px', letterSpacing: '-1px' } },
          site
        ),
        React.createElement(
          'div',
          { style: { display: 'flex', gap: 22, marginTop: 12 } },
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 24,
                padding: '22px 28px',
                minWidth: 320,
                background: 'linear-gradient(160deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.86) 100%)',
                border: '1px solid rgba(96,165,250,0.45)',
                boxShadow: '0 18px 36px rgba(2, 6, 23, 0.4)',
              },
            },
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 18, opacity: 0.9, textTransform: 'uppercase', letterSpacing: 1.2, color: '#bfdbfe' } },
              'Performance'
            ),
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 140, fontWeight: 900, lineHeight: 0.9, color: '#f8fafc', marginTop: 8 } },
              String(perf)
            )
          ),
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 24,
                padding: '22px 28px',
                minWidth: 320,
                background: 'linear-gradient(160deg, rgba(30,58,138,0.88) 0%, rgba(37,99,235,0.78) 100%)',
                border: '1px solid rgba(191,219,254,0.5)',
                boxShadow: '0 18px 36px rgba(2, 6, 23, 0.45)',
              },
            },
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 18, opacity: 0.95, textTransform: 'uppercase', letterSpacing: 1.2, color: '#dbeafe' } },
              'SEO'
            ),
            React.createElement(
              'span',
              { style: { display: 'flex', fontSize: 140, fontWeight: 900, lineHeight: 0.9, color: '#ffffff', marginTop: 8 } },
              String(seo)
            )
          )
        )
      ),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 20,
            color: '#cbd5e1',
          },
        },
        React.createElement(
          'span',
          { style: { display: 'flex', fontWeight: 700 } },
          'Fix conversion problems, faster.'
        ),
        React.createElement(
          'span',
          { style: { display: 'flex', opacity: 0.9 } },
          'useaudo.com'
        )
      )
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
