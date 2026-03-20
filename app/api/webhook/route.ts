import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', 
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  // Handle the specific event: checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // We passed the auditId in the metadata when we created the session
    const auditId = session.metadata?.auditId;

    if (auditId) {
      const { error } = await supabaseAdmin
        .from('audits')
        .update({ 
          payment_status: 'paid',
          status: 'pending_review', // Moves it to the Auditor's queue
          updated_at: new Date().toISOString() 
        })
        .eq('id', auditId);

      if (error) {
        console.error('Supabase Update Error:', error);
        return new NextResponse('Database Update Failed', { status: 500 });
      }
    }
  }

  return new NextResponse('Webhook Received', { status: 200 });
}