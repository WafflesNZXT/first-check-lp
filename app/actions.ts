'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function submitLead(formData: FormData) {
  const email = formData.get('email');

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  const { error } = await supabase
    .from('leads')
    .insert([
      { 
        email, 
        status: 'pending',          
        payment_status: 'pending'   
      },
    ]);

  if (error) return { success: false, error: error.message };
  return { success: true };
}