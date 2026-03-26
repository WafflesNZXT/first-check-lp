import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;

    // Update lead payment status in Supabase
    if (customerEmail) {
      const { error } = await supabaseAdmin
        .from('leads')
        .update({
          payment_status: 'paid',
          status: 'pending_review',
          updated_at: new Date().toISOString()
        })
        .eq('email', customerEmail)
        .eq('payment_status', 'pending');

      if (error) {
        console.error('Supabase Update Error:', error);
      }

      // Email to customer asking for their URL
      await resend.emails.send({
        from: 'Wafi from audo <onboarding@resend.dev>',
        to: customerEmail,
        subject: 'Your audo access is confirmed — one quick step',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">Payment confirmed!</h2>
            <p style="color: #555; font-size: 16px; margin-bottom: 24px;">Hey, Wafi here from audo. Your $29 dashboard access is confirmed.</p>
            
            <p style="font-size: 16px; margin-bottom: 8px;">One quick step to finish setup:</p>
            
            <div style="background: #f5f5f5; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 16px; font-weight: 700;">Add your website URL in the setup flow:</p>
              <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #333;">
                <li style="margin-bottom: 8px;">Open your success page after checkout</li>
                <li style="margin-bottom: 8px;">Submit your website URL</li>
                <li>Then continue in your dashboard to run your first audit</li>
              </ul>
            </div>
            
            <p style="font-size: 16px; color: #555;">Once your URL is saved, you&apos;re ready to start using the dashboard workflow.</p>
            
            <p style="font-size: 16px; margin-top: 32px;">Talk soon,<br><strong>Wafi Syed</strong><br>Founder, audo<br><a href="https://usefirstcheck.vercel.app" style="color: #2563eb;">usefirstcheck.vercel.app</a></p>
          </div>
        `,
      });

      // Notification email to you
      await resend.emails.send({
        from: 'audo Notifications <onboarding@resend.dev>',
        to: 'wafi.syed5@gmail.com',
        subject: `New dashboard access order — ${customerEmail}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
            <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 8px;">New order received!</h2>
            <p style="font-size: 16px; color: #555;">Someone just paid for dashboard access.</p>
            
            <div style="background: #f5f5f5; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Customer email:</strong> ${customerEmail}</p>
              <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> $29</p>
              <p style="margin: 0;"><strong>Status:</strong> Waiting for URL setup completion.</p>
            </div>
            
            <p style="font-size: 14px; color: #888;">Check your Supabase leads table for the full record.</p>
          </div>
        `,
      });

      console.log(`[New Order] Payment confirmed for ${customerEmail}`);
    }
  }

  return new NextResponse('Webhook Received', { status: 200 });
}