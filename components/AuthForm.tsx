'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()


  // Use shared client from `lib/supabase` to avoid recreating client each render

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Wrap auth call with a timeout so it can't hang the UI indefinitely
      const authPromise = (async () => {
        if (mode === 'signup') {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
          if (error) throw error
          setMessage('Check your email to confirm your account.')
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (error) throw error

          // Exchange session with server so SSR can read cookies (required on deployed domains)
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  access_token: session.access_token,
                  refresh_token: session.refresh_token,
                }),
              })
            }
          } catch (e) {
            // non-fatal; continue to redirect client
          }

          // Success: Refresh and redirect
          router.refresh()
          setTimeout(() => {
            router.push('/dashboard')
          }, 100)
        }
      })()

      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth request timed out')), 10000))
      await Promise.race([authPromise, timeout])
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-10 py-12 px-6">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-black">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-gray-500 text-base md:text-lg">
          {mode === 'signin' 
            ? 'Enter your details to access your dashboard' 
            : 'Start getting ruthless feedback on your site'}
        </p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <input
            type="email"
            placeholder="email@example.com"
            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all text-black text-base placeholder:text-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="password"
            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all text-black text-base placeholder:text-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-base hover:bg-gray-800 transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      
      {message && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-center text-sm text-blue-700 font-medium">{message}</p>
        </div>
      )}
      
      <div className="text-center">
        <button 
          onClick={() => router.push(mode === 'signin' ? '/signup' : '/signin')}
          className="text-sm text-gray-400 hover:text-black transition-colors"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  )
}