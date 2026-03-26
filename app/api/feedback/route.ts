import { resend } from '@/lib/resend';

const EMAIL_FROM = 'feedback@useaudo.com';

import { Resend } from 'resend'; 

export async function POST(req: Request) {
  const { message, userEmail } = await req.json();

  await resend.emails.send({
    from: EMAIL_FROM,
    to: 'wafi.syed5@gmail.com', // Where you want to read feedback
    subject: `New Feedback from ${userEmail}`,
    text: message,
    replyTo: userEmail, // Allows you to just click "Reply" in your inbox
  });

  return Response.json({ success: true });
}