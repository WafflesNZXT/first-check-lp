'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function SuccessContent() {
  const searchParams = useSearchParams()
  const customerEmail = searchParams.get('email')
  
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerEmail) {
      setStatus('error')
      return
    }
    
    setStatus('loading')

    const { error } = await supabase
      .from('leads')
      .update({ website_url: url }) // Using your column name: website_url
      .eq('email', customerEmail)
      .eq('payment_status', 'paid')

    if (error) {
      console.error(error)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-white font-sans">
      <div className="max-w-md w-full">
        <h1 className="text-4xl font-black mb-4 text-black tracking-tight">PAYMENT CONFIRMED! ⚡️</h1>
        
        {status !== 'success' ? (
          <>
            <p className="text-gray-600 mb-8 text-lg">
              Order confirmed for <span className="font-bold text-black">{customerEmail || 'your email'}</span>. 
              Drop your URL below to start the 24-hour audit clock.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="url"
                required
                placeholder="https://yourstartup.com"
                className="w-full p-4 border-4 border-black rounded-2xl focus:ring-4 focus:ring-blue-500 outline-none text-lg font-medium"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-black text-white py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
              >
                {status === 'loading' ? 'SYNCING...' : 'START MY AUDIT →'}
              </button>
            </form>
            {status === 'error' && (
              <p className="mt-4 text-red-500 font-bold">Something went wrong. Please reply to the email instead!</p>
            )}
          </>
        ) : (
          <div className="bg-blue-50 p-10 rounded-[2rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(37,99,235,0.2)]">
            <h2 className="text-3xl font-black text-blue-600 mb-4">GOT IT. 🕒</h2>
            <p className="text-gray-800 text-lg font-medium leading-relaxed">
              Your audit is officially in the queue. I'll have your deep-dive report ready in less than 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}