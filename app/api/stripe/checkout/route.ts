import { stripe } from '@/lib/stripe'; 
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { priceId, customerId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription', // This makes it recurring
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}