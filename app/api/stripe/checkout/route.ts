import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import getServerSupabase from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', // Ensure this matches your Stripe library version
});

export async function POST() {
  try {
    const supabase = await getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    const existingCustomerId = profile?.stripe_customer_id ?? null;

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      ...(existingCustomerId ? { customer: existingCustomerId } : { customer_email: user.email }),
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO, // Using the .env variable
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id, 
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe Checkout Error:", error);
    const message = error instanceof Error ? error.message : 'Stripe checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}