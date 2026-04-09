import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import getServerSupabase from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRO_MAX_AUDITS = 100;

export async function POST(req: Request) {
  try {
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { sessionId?: string };
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadataUserId = session.metadata?.userId ?? null;
    const referenceUserId = session.client_reference_id ?? null;

    const sessionBelongsToUser = metadataUserId === user.id || referenceUserId === user.id;
    if (!sessionBelongsToUser) {
      return NextResponse.json({ error: 'Session does not match current user' }, { status: 403 });
    }

    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'Checkout session is not complete' }, { status: 409 });
    }

    const customerId = typeof session.customer === 'string' ? session.customer : null;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        plan_type: 'pro',
        max_audits: PRO_MAX_AUDITS,
        ...(customerId ? { stripe_customer_id: customerId } : {}),
        ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Confirmation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
