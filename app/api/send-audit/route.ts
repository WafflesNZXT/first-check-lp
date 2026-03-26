import { resend } from '@/lib/resend';
import { NextResponse } from 'next/server';
    
const EMAIL_FROM = 'roast@useaudo.com';

export async function POST(req: Request) {
  const { email, auditData, hostname } = await req.json();

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: `Your Website Audit for ${hostname} is Ready`,
      replyTo: 'wafi.syed5@gmail.com',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -1px;">audo</h1>
          <p style="font-size: 18px; line-height: 1.6; color: #333;">${auditData.summary}</p>
          
          <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-top: 40px;">Improvement Roadmap</h2>
          ${auditData.checklist.map((item: any) => `
            <div style="padding: 15px; border-bottom: 1px solid #eee;">
              <strong style="display: block; font-size: 16px;">${item.issue}</strong>
              <p style="color: #666; font-size: 14px; margin: 5px 0 0 0;">Fix: ${item.fix}</p>
            </div>
          `).join('')}
          
          <a href="https://useaudo.com/dashboard" style="display: inline-block; background: black; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 30px;">
            Open Interactive Checklist
          </a>
        </div>
      `,
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}