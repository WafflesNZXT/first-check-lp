import { resend } from '@/lib/resend';
import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const EMAIL_FROM = 'audo <hello@useaudo.com>';

export async function POST(req: Request) {
  try {
    let emailFromBody: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.email === 'string') {
        emailFromBody = body.email;
      }
    } catch {
      // No body provided; continue with authenticated user lookup.
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData.user;
    const userId = currentUser?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: claimRow, error: claimError } = await supabase
      .from('profiles')
      .update({ welcome_sent: true })
      .eq('id', userId)
      .eq('welcome_sent', false)
      .select('id')
      .maybeSingle();

    if (claimError) {
      return NextResponse.json({ error: 'Could not claim welcome email send state' }, { status: 500 });
    }

    let claimedRow = claimRow;

    if (!claimedRow) {
      const { data: claimNullRow, error: claimNullError } = await supabase
        .from('profiles')
        .update({ welcome_sent: true })
        .eq('id', userId)
        .is('welcome_sent', null)
        .select('id')
        .maybeSingle();

      if (claimNullError) {
        return NextResponse.json({ error: 'Could not claim welcome email send state' }, { status: 500 });
      }

      claimedRow = claimNullRow;
    }

    if (!claimedRow) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const email = (currentUser?.email || emailFromBody || '').trim();
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Welcome to audo`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #000;">
          <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -1px;">audo</h1>
          <p style="font-size: 18px; line-height: 1.6;">Thanks for joining.</p>
          <p style="font-size: 16px; line-height: 1.6; color: #444;">
            I built <strong>audo</strong> because most site audits are just long paragraphs of fluff. 
            We give you a checklist of exactly what to fix so you can stop guessing and start building.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #444;">
            Ready to roast your first site?
          </p>
          <a href="https://useaudo.com/dashboard" style="display: inline-block; background: black; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Run Your First Audit
          </a>
          <p style="margin-top: 40px; font-size: 14px; color: #999;">
            — Founder, audo
          </p>
        </div>
      `,
    });

    if (error) {
      const { error: rollbackError } = await supabase
        .from('profiles')
        .update({ welcome_sent: false })
        .eq('id', userId)
        .eq('welcome_sent', true);

      void rollbackError;

      return NextResponse.json({ error: String(error.message || 'Welcome email failed') }, { status: 500 });
    }

    if (!data?.id) {
      const { error: rollbackError } = await supabase
        .from('profiles')
        .update({ welcome_sent: false })
        .eq('id', userId)
        .eq('welcome_sent', true);

      void rollbackError;

      return NextResponse.json({ error: 'Welcome email was not accepted by provider' }, { status: 502 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Welcome email failed' }, { status: 500 });
  }
}