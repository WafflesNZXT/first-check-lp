import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const PRO_MAX_AUDITS = 100;
const FREE_MAX_AUDITS = 2;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', // Use the required API version
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

function isProSubscriptionStatus(status: Stripe.Subscription.Status) {
  return status === 'active' || status === 'trialing' || status === 'past_due' || status === 'unpaid';
}

async function updateProfileById(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Supabase Profile Update Error:', error);
  }
}

async function updateProfileByCustomerId(customerId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Supabase Profile Update Error:', error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = typeof session.customer === 'string' ? session.customer : null;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  const customerEmail = session.customer_details?.email;

  if (!userId) {
    console.error('Missing metadata.userId in checkout.session.completed', session.id);
    return;
  }

  await updateProfileById(userId, {
    plan_type: 'pro',
    max_audits: PRO_MAX_AUDITS,
    ...(customerId ? { stripe_customer_id: customerId } : {}),
    ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
  });

  if (customerEmail) {
    try {
      await resend.emails.send({
        from: 'Wafi from audo <onboarding@resend.dev>',
        to: customerEmail,
        subject: 'Your audo PRO access is confirmed!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="font-size: 32px; font-weight: 800; letter-spacing: -1px;">audo</h1>
            <h2>Welcome to audo Pro!</h2>
            <p>Hey! Your payment was successful and your dashboard is now unlocked.</p>
            <p>You now have <strong>Unlimited Audits</strong> and access to the Predictor page.</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=1" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Dashboard</a>
            <p style="margin-top: 20px;">- Wafi</p>
          </div>
        `,
      });

      await resend.emails.send({
        from: 'audo Sales <onboarding@resend.dev>',
        to: 'wafi.syed5@gmail.com',
        subject: `💰 New Pro Subscriber: ${customerEmail}`,
        text: `User ${customerEmail} just upgraded to Pro for $29/mo!`,
      });
    } catch (emailError) {
      console.error('Webhook email send error:', emailError);
    }
  }

  console.log(`🚀 User ${userId} successfully upgraded to PRO`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

  if (!customerId) {
    return;
  }

  const isPro = isProSubscriptionStatus(subscription.status);

  await updateProfileByCustomerId(customerId, {
    stripe_customer_id: customerId,
    subscription_id: isPro ? subscription.id : null,
    plan_type: isPro ? 'pro' : 'free',
    max_audits: isPro ? PRO_MAX_AUDITS : FREE_MAX_AUDITS,
  });

  console.log(`🔄 Subscription updated for customer ${customerId}; status=${subscription.status}; plan=${isPro ? 'pro' : 'free'}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

  if (!customerId) {
    return;
  }

  await updateProfileByCustomerId(customerId, {
    stripe_customer_id: customerId,
    subscription_id: null,
    plan_type: 'free',
    max_audits: FREE_MAX_AUDITS,
  });

  console.log(`🧾 Subscription deleted for customer ${customerId}; downgraded to free`);
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  if (!signature) {
    return new NextResponse('Missing Stripe signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid webhook event';
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }
    default:
      break;
  }

  return new NextResponse('Webhook Received', { status: 200 });
}