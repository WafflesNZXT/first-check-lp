import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resend } from '@/lib/resend'

const EMAIL_FROM = 'audo <hello@useaudo.com>'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const auditId = String(body?.auditId || '').trim()
    const inviteeEmail = String(body?.email || '').trim().toLowerCase()
    const origin = String(body?.origin || '').trim()

    if (!auditId || !inviteeEmail) {
      return NextResponse.json({ error: 'Missing auditId or email' }, { status: 400 })
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
    const currentUser = authData.user
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select('id, website_url')
      .eq('id', auditId)
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (auditError) {
      return NextResponse.json({ error: 'Failed to verify audit ownership' }, { status: 500 })
    }

    if (!audit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const baseUrl = origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://useaudo.com'
    const cleanBaseUrl = baseUrl.replace(/\/$/, '')
    const sharedAuditPath = `/dashboard/audit/${auditId}`
    const auditUrl = `${cleanBaseUrl}${sharedAuditPath}`
    const signinUrl = `${cleanBaseUrl}/signin?next=${encodeURIComponent(sharedAuditPath)}`

    let hostname = 'your project site'
    try {
      const urlToParse = String(audit.website_url || '').startsWith('http')
        ? String(audit.website_url)
        : `https://${String(audit.website_url)}`
      hostname = new URL(urlToParse).hostname
    } catch {
      hostname = String(audit.website_url || hostname)
    }

    const { error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: inviteeEmail,
      subject: `You were invited to review an audit for ${hostname}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -1px;">audo</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 20px;">
            ${currentUser.email || 'A teammate'} invited you to review a website audit for <strong>${hostname}</strong>.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #555;">
            Sign in (or create an account) with this email to access the shared audit.
          </p>
          <a href="${signinUrl}" style="display: inline-block; margin-top: 20px; background: #000; color: #fff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-weight: 700;">
            Sign In to Open Shared Audit
          </a>
          <p style="margin-top: 26px; font-size: 12px; color: #888; word-break: break-all;">
            ${auditUrl}
          </p>
        </div>
      `,
    })

    if (emailError) {
      return NextResponse.json({ error: String(emailError.message || 'Invite email failed') }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invite email failed' }, { status: 500 })
  }
}
