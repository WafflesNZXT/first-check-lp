import { resend } from '@/lib/resend';
import { NextResponse } from 'next/server';

const EMAIL_FROM = 'audo <hello@useaudo.com>';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Welcome email failed' }, { status: 500 });
  }
}