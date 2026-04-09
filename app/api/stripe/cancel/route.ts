import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import getServerSupabase from '@/utils/supabase/server';
import { resend } from '@/lib/resend';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FREE_MAX_AUDITS = 2;
const CANCELLATION_EMAIL_TO = 'wafi.syed5@gmail.com';
const CANCELLATION_EMAIL_FROM = 'audo Billing <onboarding@resend.dev>';

type CancelPayload = {
  reason?: string;
  comment?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = (await req.json().catch(() => ({}))) as CancelPayload;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id,stripe_customer_id,plan_type')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: 'Unable to load subscription state' }, { status: 500 });
    }

    if (profile?.plan_type !== 'pro') {
      return NextResponse.json({ error: 'No active pro subscription found' }, { status: 409 });
    }

    let subscriptionId = profile.subscription_id || null;

    if (!subscriptionId && profile?.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'all',
        limit: 5,
      });
      const cancelable = subscriptions.data.find((subscription) => {
        return subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'past_due' || subscription.status === 'unpaid';
      });
      subscriptionId = cancelable?.id || null;
    }

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No Stripe subscription found to cancel' }, { status: 409 });
    }

    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan_type: 'free',
        max_audits: FREE_MAX_AUDITS,
        subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Subscription canceled, but profile update failed. Please contact support.' }, { status: 500 });
    }

    const reasonText = (payload.reason || 'not_provided').trim();
    const commentText = (payload.comment || '').trim();

    await resend.emails.send({
      from: CANCELLATION_EMAIL_FROM,
      to: CANCELLATION_EMAIL_TO,
      subject: `⚠️ Pro cancellation: ${user.email || user.id}`,
      text: [
        `User: ${user.email || 'unknown email'}`,
        `User ID: ${user.id}`,
        `Stripe Customer: ${profile.stripe_customer_id || 'none'}`,
        `Canceled Subscription: ${canceledSubscription.id}`,
        `Reason: ${reasonText}`,
        `Comment: ${commentText || 'none'}`,
      ].join('\n'),
      replyTo: user.email || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to cancel subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
