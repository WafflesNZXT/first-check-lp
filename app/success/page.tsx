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
  // This will be empty because Stripe doesn't send it, which is fine!
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    // We update the row where the email matches AND they have paid
    const { error } = await supabase
      .from('leads')
      .update({ website_url: url })
      .eq('email', email.trim().toLowerCase())
      .eq('payment_status', 'paid')

    if (error) {
      console.error('Supabase Error:', error)
      setStatus('error')
    } else {
      setStatus('success')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white font-sans">
      <div className="max-w-md w-full border border-gray-200 p-10 rounded-[32px] shadow-sm">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Received!</h1>
            <p className="text-gray-500">Let's get your audit started.</p>
        </div>
        
        {status !== 'success' ? (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm your Email</label>
              <input
                type="email"
                required
                placeholder="The email you used to pay"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
              <input
                type="url"
                required
                placeholder="https://yourstartup.com"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all"
            >
              {status === 'loading' ? 'Saving...' : 'Submit for Audit'}
            </button>
            {status === 'error' && (
                <p className="text-red-500 text-sm font-medium">Couldn't find an order for that email. Check the spelling or reply to your email!</p>
            )}
          </form>
        ) : (
          <div className="py-10">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Audit Queued</h2>
            <p className="text-gray-500">I've received your site. Expect your report at <strong>{email}</strong> within 24 hours.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  )
}