'use server'

import { createClient } from '@supabase/supabase-js'

// The '!' tells TypeScript to trust that these variables exist in your .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function submitLead(formData: FormData) {
  // Extract and cast the email to a string
  const email = formData.get('email') as string

  // Insert into your 'leads' table
  const { error } = await supabase
    .from('leads')
    .insert([{ email }])

  if (error) {
    console.error("Supabase Error:", error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}