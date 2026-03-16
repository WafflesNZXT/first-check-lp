'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function submitLead(formData: FormData) {
  const email = formData.get('email') as string
  const price_amount = formData.get('price_amount')
  const price_type = formData.get('price_type')
  const honeypot = formData.get('website')

  // Honeypot security
  if (honeypot) return { success: true }

  const { error } = await supabase
    .from('leads')
    .insert([{ 
      email, 
      price_amount: parseInt(price_amount as string), 
      price_type 
    }])

  if (error) {
    console.error("Supabase Error:", error.message)
    // If user already exists, we treat it as success to not annoy them
    if (error.code === '23505') return { success: true }
    return { success: false, error: "Submission failed." }
  }

  return { success: true }
}