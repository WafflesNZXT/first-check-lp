import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-ignore
  apiVersion: "2026-02-25.clover", 
});

export async function POST(req: Request) {
  const body = await req.text(); 
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the specific event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;

    if (email) {
      console.log(`✅ Payment confirmed for: ${email}`);
      const { error } = await supabase
        .from("leads")
        .update({ payment_status: "complete" })
        .eq("email", email);

      if (error) {
        console.error("Supabase Update Error:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}