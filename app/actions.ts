'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function submitLead(formData: FormData) {
  const email = formData.get('email');
  const website_url = formData.get('website_url');

  if (!email || !website_url) {
    return { success: false, error: "Email and Website URL are required." };
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([
      { 
        email, 
        website_url, 
        status: 'pending' 
      },
    ]);

  if (error) return { success: false, error: error.message };
  return { success: true };
}