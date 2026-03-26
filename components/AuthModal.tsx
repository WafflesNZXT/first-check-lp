'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  if (!isOpen) return null

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) alert(error.message)
    else alert('Check your email to confirm!')
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-300">
        <h2 className="text-3xl font-black tracking-tighter mb-2">Join audo</h2>
        <p className="text-gray-500 mb-8 text-sm">Start roasting your website today.</p>
        
        <form onSubmit={handleSignUp} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <button onClick={onClose} className="w-full mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">Cancel</button>
      </div>
    </div>
  )
}