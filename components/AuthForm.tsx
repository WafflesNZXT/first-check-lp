'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const submittingRef = useRef(false)
  const oauthSyncInFlightRef = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNextPath = searchParams.get('next') || '/dashboard'
  const nextPath = rawNextPath.startsWith('/') ? rawNextPath : '/dashboard'
  const authLinkHref = `${mode === 'signin' ? '/signup' : '/signin'}${searchParams.get('next') ? `?next=${encodeURIComponent(nextPath)}` : ''}`

  useEffect(() => {
    if (mode === 'signin') {
      router.prefetch(nextPath)
    }
  }, [mode, nextPath, router])

  useEffect(() => {
    if (mode !== 'signin') return
    const authState = searchParams.get('auth')
    if (authState === 'expired_link') {
      setMessage('That email confirmation link has expired or was already used. Sign in with your password to continue.')
      return
    }
    if (authState === 'oauth_failed') {
      setMessage('Google sign-in could not be completed. Please try again.')
      return
    }
    if (authState === 'oauth_code_used') {
      setMessage('That Google sign-in link was already used. Please click Continue with Google again.')
      return
    }
    if (authState === 'missing_code') {
      setMessage('That confirmation link is invalid. Sign in to continue.')
      return
    }
    if (authState === 'oauth_missing_code') {
      setMessage('Google sign-in did not return a valid auth code. Please try again.')
    }
  }, [mode, searchParams])

  useEffect(() => {
    const oauth = searchParams.get('oauth')
    if (oauth !== '1') return

    let active = true

    const syncServerSessionAndRedirect = async (session: { access_token: string; refresh_token: string }) => {
      if (!active || oauthSyncInFlightRef.current) return
      oauthSyncInFlightRef.current = true
      setLoading(true)
      setMessage('')

      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        })
        if (!active) return
        router.replace(nextPath)
      } catch {
        if (!active) return
        setMessage('Google sign-in succeeded, but session sync failed. Please try again.')
        setLoading(false)
      } finally {
        oauthSyncInFlightRef.current = false
      }
    }

    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        await syncServerSessionAndRedirect(data.session)
      }
    })()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return
      void syncServerSessionAndRedirect(session)
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [nextPath, router, searchParams])


  // Use shared client from `lib/supabase` to avoid recreating client each render

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
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
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
          } catch {
            // non-fatal; continue to redirect client
          }

          // Success: navigate immediately after session exchange attempt
          router.replace(nextPath)
        }
      })()

      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth request timed out')), 10000))
      await Promise.race([authPromise, timeout])
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (loading) return
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/${mode === 'signin' ? 'signin' : 'signup'}?next=${encodeURIComponent(nextPath)}&oauth=1`,
        },
      })

      if (error) throw error
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Google authentication failed')
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
            : 'Start running audits and tracking fixes in your dashboard'}
        </p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full border border-gray-200 bg-white text-black py-4 rounded-2xl font-bold text-base hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-[0.98] inline-flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className="h-5 w-5">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.86 2.7-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.35-1.58-5.06-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.94 10.72A5.4 5.4 0 0 1 3.66 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l2.98-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.33l2.58-2.58C13.46.88 11.43 0 9 0A9 9 0 0 0 .96 4.95l2.98 2.33c.7-2.12 2.7-3.7 5.06-3.7Z" />
          </svg>
          {mode === 'signin' ? 'Sign In with Google' : 'Sign Up with Google'}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

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
        <Link
          href={authLinkHref}
          className="text-sm text-gray-400 hover:text-black transition-colors"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </Link>
      </div>
    </div>
  )
}