import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; 

export async function POST(req: Request) {
  const payload = await req.json();

  // We only care about the 'checkout.session.completed' event
  if (payload.type === 'checkout.session.completed') {
    const session = payload.data.object;
    const email = session.customer_details.email;

    // Update the payment_status in Supabase
    const { error } = await supabase
      .from('leads')
      .update({ payment_status: 'complete' })
      .eq('email', email);

    if (error) {
      console.error('Supabase Update Error:', error);
      return NextResponse.json({ error: 'Failed to update DB' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}