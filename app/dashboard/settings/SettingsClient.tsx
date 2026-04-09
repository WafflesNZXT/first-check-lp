"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardHeaderActions from '@/components/DashboardHeaderActions'

type BillingSnapshot = {
  planType: string
  auditCount: number
  maxAudits: number
  hasStripeCustomer: boolean
  hasSubscription: boolean
}

const CANCEL_REASONS = [
  'Too expensive right now',
  'Did not get enough value',
  'Missing key features I need',
  'Only needed it short-term',
  'Switching to another tool',
  'Other',
] as const

export default function SettingsClient({ email, initialBilling }: { email: string; initialBilling: BillingSnapshot }) {
  const [showChangePw, setShowChangePw] = useState(false)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [dangerAction, setDangerAction] = useState<null | 'delete' | 'erase'>(null)
  const [dangerMsg, setDangerMsg] = useState('')
  const [billingError, setBillingError] = useState('')
  const [billingMsg, setBillingMsg] = useState('')
  const [billing, setBilling] = useState<BillingSnapshot>(initialBilling)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0])
  const [cancelComment, setCancelComment] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  const isPro = billing.planType === 'pro' || billing.planType === 'admin'

  async function openBillingPortal() {
    try {
      setLoading(true)
      setBillingError('')
      setBillingMsg('')

      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload?.url) {
        throw new Error(String(payload?.error || 'Unable to open billing portal'))
      }

      window.location.href = String(payload.url)
    } catch (error: unknown) {
      setBillingError(error instanceof Error ? error.message : 'Unable to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  async function cancelPlanNow() {
    try {
      setCancelSubmitting(true)
      setCancelError('')
      setBillingError('')
      setBillingMsg('')

      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, comment: cancelComment }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(String(payload?.error || 'Unable to cancel plan'))
      }

      setBilling((previous) => ({
        ...previous,
        planType: 'free',
        maxAudits: 2,
        hasSubscription: false,
      }))
      setBillingMsg('Your subscription has been canceled. Your plan is now Free (2 max audits).')
      setShowCancelModal(false)
      setCancelComment('')
      setCancelReason(CANCEL_REASONS[0])
    } catch (error: unknown) {
      setCancelError(error instanceof Error ? error.message : 'Unable to cancel plan')
    } finally {
      setCancelSubmitting(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setPwMsg('')
    if (pw1 !== pw2) {
      setPwMsg('Passwords do not match.')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: pw1 })
    setPwMsg(error ? error.message : 'Password updated!')
    setLoading(false)
    setPw1('')
    setPw2('')
    setShowChangePw(false)
  }

  async function handleDanger(action: 'delete' | 'erase') {
    setLoading(true)
    setDangerMsg('')
    if (action === 'delete') {
      // Delete account
      const { error } = await supabase.rpc('delete_user_and_data')
      setDangerMsg(error ? error.message : 'Account deleted. Logging out...')
      if (!error) setTimeout(() => { window.location.href = '/signout' }, 1500)
    } else if (action === 'erase') {
      // Delete all audits
      const { error } = await supabase.from('audits').delete().neq('id', 0)
      setDangerMsg(error ? error.message : 'All audits erased!')
    }
    setLoading(false)
    setDangerAction(null)
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-2xl mx-auto py-2 sm:py-4">
        <div className="rounded-3xl border border-black/10 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_12px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)] p-6 md:p-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black dark:text-white mb-8">Settings</h1>
        <div className="mb-8 flex justify-end">
          <DashboardHeaderActions />
        </div>
        <div className="mb-8 space-y-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
            <div className="font-mono text-lg text-black dark:text-white">{email}</div>
          </div>

          <div className="rounded-2xl border border-black/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Billing</p>
                <p className="text-xl font-extrabold tracking-tight text-black dark:text-white mt-1">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Audits used: <strong>{billing.auditCount}</strong> / {billing.maxAudits}
                </p>
                {isPro ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">Predict is enabled. Audit detail history remains available.</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Predict is locked on Free. You can still access all previous audits.</p>
                )}
              </div>

              <div className="flex flex-col gap-2 min-w-[220px]">
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={loading || !billing.hasStripeCustomer}
                  className="rounded-xl border border-black/15 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-black dark:text-white disabled:opacity-60"
                >
                  Manage Billing
                </button>

                {isPro && billing.hasSubscription && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    disabled={loading}
                    className="rounded-xl bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Cancel Pro Plan
                  </button>
                )}
              </div>
            </div>

            {(billingError || billingMsg) && (
              <p className={`text-xs mt-3 ${billingError ? 'text-red-500 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                {billingError || billingMsg}
              </p>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Password</div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-black dark:text-white">••••••••</span>
              <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm" onClick={() => setShowChangePw(v => !v)}>
                Change Password
              </button>
            </div>
            {showChangePw && (
              <form className="mt-2 space-y-2" onSubmit={handleChangePassword}>
                <input
                  type="password"
                  className="border border-black/10 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 w-full text-black dark:text-white"
                  placeholder="New password"
                  value={pw1}
                  onChange={e => setPw1(e.target.value)}
                  minLength={8}
                  required
                />
                <input
                  type="password"
                  className="border border-black/10 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 w-full text-black dark:text-white"
                  placeholder="Confirm new password"
                  value={pw2}
                  onChange={e => setPw2(e.target.value)}
                  minLength={8}
                  required
                />
                <div className="flex gap-2 items-center">
                  <button type="submit" className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-1 rounded disabled:opacity-60" disabled={loading}>
                    Save
                  </button>
                  <button type="button" className="text-gray-500 dark:text-gray-400 hover:underline text-sm" onClick={() => setShowChangePw(false)}>
                    Cancel
                  </button>
                  {pwMsg && <span className="text-xs ml-2 text-gray-600 dark:text-gray-300">{pwMsg}</span>}
                </div>
              </form>
            )}
          </div>
        </div>
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4">
              <div>
                <div className="font-semibold text-red-700 dark:text-red-400">Delete Account</div>
                <div className="text-xs text-red-500 dark:text-red-300">This will permanently delete your account and all data.</div>
              </div>
              <button className="bg-red-600 dark:bg-red-700 text-white px-4 py-1 rounded" onClick={() => setDangerAction('delete')}>
                Delete
              </button>
            </div>
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4">
              <div>
                <div className="font-semibold text-red-700 dark:text-red-400">Erase Audit History</div>
                <div className="text-xs text-red-500 dark:text-red-300">This will delete all your audits. This cannot be undone.</div>
              </div>
              <button className="bg-red-500 dark:bg-red-600 text-white px-4 py-1 rounded" onClick={() => setDangerAction('erase')}>
                Erase
              </button>
            </div>
          </div>
          {dangerAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-sm w-full shadow-xl">
                <h3 className="text-xl font-bold mb-2 text-red-700 dark:text-red-400">Are you sure?</h3>
                <p className="mb-4 text-sm text-gray-700 dark:text-gray-200">
                  {dangerAction === 'delete' ? 'This will permanently delete your account and all data. This cannot be undone.' : 'This will erase all your audits. This cannot be undone.'}
                </p>
                <div className="flex gap-2">
                  <button
                    className="bg-red-600 dark:bg-red-700 text-white px-4 py-1 rounded disabled:opacity-60"
                    onClick={() => handleDanger(dangerAction)}
                    disabled={loading}
                  >
                    Confirm
                  </button>
                  <button className="bg-gray-200 dark:bg-slate-800 text-black dark:text-white px-4 py-1 rounded" onClick={() => setDangerAction(null)} disabled={loading}>
                    Cancel
                  </button>
                </div>
                {dangerMsg && <div className="mt-2 text-xs text-red-500 dark:text-red-300">{dangerMsg}</div>}
              </div>
            </div>
          )}
        </div>

        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-7 max-w-lg w-full shadow-xl border border-black/10 dark:border-slate-700">
              <h3 className="text-xl font-extrabold tracking-tight text-black dark:text-white">Before you cancel Pro</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Your cancellation is immediate. Here’s what changes now:</p>

              <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-200 list-disc pl-5">
                <li>Your plan switches to Free instantly.</li>
                <li>Your max audits resets to 2 and new audits are blocked after that limit.</li>
                <li>Predict access is removed.</li>
                <li>Your existing audit history stays available.</li>
              </ul>

              <div className="mt-5 space-y-3">
                <label className="block text-sm font-semibold text-black dark:text-white">Why are you leaving?</label>
                <select
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  className="w-full rounded-xl border border-black/10 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white"
                >
                  {CANCEL_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>

                <textarea
                  value={cancelComment}
                  onChange={(event) => setCancelComment(event.target.value)}
                  placeholder="Optional: anything we could have done better?"
                  className="w-full min-h-[90px] rounded-xl border border-black/10 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-black dark:text-white"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Your response is sent to the founder for product improvements.</p>
              </div>

              {cancelError && <p className="mt-3 text-xs text-red-500 dark:text-red-300">{cancelError}</p>}

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-black/10 dark:border-slate-700 px-4 py-2 text-sm text-black dark:text-white"
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelSubmitting}
                >
                  Keep Pro
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  onClick={cancelPlanNow}
                  disabled={cancelSubmitting}
                >
                  {cancelSubmitting ? 'Canceling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
