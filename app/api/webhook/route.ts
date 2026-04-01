import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', // Use the required API version
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
    const userId = session.metadata?.userId; // Getting this from our Checkout Route
    console.log("Found User ID in Webhook:", userId)
    const customerEmail = session.customer_details?.email;
    

    if (userId) {
      // 1. UPDATE THE USER TO PRO IN SUPABASE
      const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        plan_type: 'pro',
        stripe_customer_id: session.customer as string,
        subscription_id: session.subscription as string,
        max_audits: 100, 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

      console.log("UPDATE RESULT:", { error });

      if (error) console.error('Supabase Profile Update Error:', error);

      // 2. SEND WELCOME EMAIL TO CUSTOMER
      if (customerEmail) {
        await resend.emails.send({
          from: 'Wafi from audo <onboarding@resend.dev>',
          to: customerEmail,
          subject: 'Your audo PRO access is confirmed!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to audo Pro!</h2>
              <p>Hey! Your payment was successful and your dashboard is now unlocked.</p>
              <p>You now have <strong>Unlimited Audits</strong> and access to the Predictor page.</p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a>
              <p style="margin-top: 20px;">- Wafi</p>
            </div>
          `,
        });

        // 3. NOTIFICATION EMAIL TO YOU
        await resend.emails.send({
          from: 'audo Sales <onboarding@resend.dev>',
          to: 'wafi.syed5@gmail.com', // Your email
          subject: `💰 New Pro Subscriber: ${customerEmail}`,
          text: `User ${customerEmail} just upgraded to Pro for $29/mo!`,
        });
      }

      console.log(`🚀 User ${userId} successfully upgraded to PRO`);
    }
  }

  return new NextResponse('Webhook Received', { status: 200 });
}