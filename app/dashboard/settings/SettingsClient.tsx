"use client"

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
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

// const SETTINGS_DICTIONARY: Array<{ term: string; definition: string }> = [
//   { term: 'Audit', definition: 'A single website analysis run with scores and checklist output.' },
//   { term: 'Checklist Progress', definition: 'Percent of checklist items marked complete for an audit.' },
//   { term: 'Team Workflow', definition: 'Task board where creators assign fixes and assignees update stage.' },
//   { term: 'Benchmark', definition: 'Side-by-side score comparison between your site and a competitor.' },
//   { term: 'Pro Plan', definition: 'Paid plan with Predict access and higher audit limits.' },
// ]

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (showCancelModal) {
        event.preventDefault()
        setShowCancelModal(false)
        return
      }
      if (dangerAction) {
        event.preventDefault()
        setDangerAction(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showCancelModal, dangerAction])

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
    try {
      if (action === 'delete') {
        const response = await fetch('/api/account/delete', { method: 'POST' })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(String(payload?.error || 'Failed to delete account'))
        }

        setDangerMsg('Account deleted. Logging out...')
        await supabase.auth.signOut().catch(() => null)
        window.setTimeout(() => {
          window.location.href = '/signin'
        }, 800)
      } else if (action === 'erase') {
        const response = await fetch('/api/audits/erase', { method: 'POST' })
        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(String(payload?.error || 'Failed to erase audits'))
        }

        setDangerMsg('All audits erased!')
        setBilling((previous) => ({ ...previous, auditCount: 0 }))
      }
    } catch (error: unknown) {
      setDangerMsg(error instanceof Error ? error.message : 'Action failed. Please try again.')
    } finally {
      setLoading(false)
      setDangerAction(null)
    }
  }

  return (
    <div className="min-h-screen audo-dashboard-surface px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-5 border-b border-black/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black sm:text-4xl">Settings</h1>
          </div>
          <DashboardHeaderActions />
        </header>

        <div className="mt-8 space-y-8">
          <div className="mx-auto max-w-[760px] border-b border-black/10 pb-7 dark:border-slate-800">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Email</div>
            <div className="mt-3 text-xl font-black tracking-tight text-black dark:text-white sm:text-2xl">{email}</div>
          </div>

          <div className="mx-auto max-w-[760px] rounded-2xl audo-panel border p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Billing</p>
                <p className="mt-5 text-2xl font-black tracking-tight text-black">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </p>
                <p className="mt-2 text-base font-medium text-gray-500">
                  Audits used <strong className="font-black text-black">{billing.auditCount}</strong> / {billing.maxAudits}
                </p>
                {isPro ? (
                  <p className="mt-4 text-sm font-medium text-emerald-600">Predict is enabled. Audit detail history remains available.</p>
                ) : (
                  <p className="mt-4 text-sm font-medium text-gray-500">Predict is locked on Free. You can still access all previous audits.</p>
                )}
              </div>

              <div className="flex min-w-[180px] flex-col gap-2">
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={loading || !billing.hasStripeCustomer}
                  className="rounded-full audo-panel border px-4 py-2.5 text-sm font-black text-black shadow-sm disabled:opacity-60"
                >
                  Manage Billing
                </button>

                {isPro && billing.hasSubscription && (
                  <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                  className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
                >
                  Cancel Pro Plan
                </button>
                )}
              </div>
            </div>

            {(billingError || billingMsg) && (
              <p className={`mt-4 text-sm ${billingError ? 'text-red-500' : 'text-emerald-700'}`}>
                {billingError || billingMsg}
              </p>
            )}
          </div>

          <div className="mx-auto max-w-[760px] border-b border-black/10 pb-7 dark:border-slate-800">
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">Password</div>
                <div className="mt-3 flex flex-wrap items-center gap-5">
                  <span className="font-mono text-xl tracking-[0.28em] text-black dark:text-white">••••••</span>
                  <button className="text-base font-black text-emerald-600" onClick={() => setShowChangePw(v => !v)}>
                    Change Password
                  </button>
                </div>
              </div>
              <Lock className="hidden h-6 w-6 text-gray-400 sm:block" />
            </div>
            {showChangePw && (
              <form className="mt-6 space-y-3" onSubmit={handleChangePassword}>
                <input
                  type="password"
                  className="w-full rounded-xl audo-panel border px-3 py-3 text-black outline-none focus:border-black focus:ring-4 focus:ring-black/5"
                  placeholder="New password"
                  value={pw1}
                  onChange={e => setPw1(e.target.value)}
                  minLength={8}
                  required
                />
                <input
                  type="password"
                  className="w-full rounded-xl audo-panel border px-3 py-3 text-black outline-none focus:border-black focus:ring-4 focus:ring-black/5"
                  placeholder="Confirm new password"
                  value={pw2}
                  onChange={e => setPw2(e.target.value)}
                  minLength={8}
                  required
                />
                <div className="flex gap-2 items-center">
                  <button type="submit" className="rounded-full bg-black px-5 py-2 text-sm font-black text-white disabled:opacity-60" disabled={loading}>
                    Save
                  </button>
                  <button type="button" className="text-sm font-bold text-gray-500 hover:underline" onClick={() => setShowChangePw(false)}>
                    Cancel
                  </button>
                  {pwMsg && <span className="ml-2 text-xs text-gray-600">{pwMsg}</span>}
                </div>
              </form>
            )}
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[760px]">
          <h2 className="mb-5 text-2xl font-black tracking-tight text-red-600">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm dark:border-red-900/60 dark:bg-red-950/25 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black text-black dark:text-red-100">Delete Account</div>
                <div className="mt-1.5 text-sm font-medium text-gray-500 dark:text-red-200/80">This will permanently delete your account and all data.</div>
              </div>
              <button className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white" onClick={() => setDangerAction('delete')}>
                Delete
              </button>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm dark:border-red-900/60 dark:bg-red-950/25 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black text-black dark:text-red-100">Erase Audit History</div>
                <div className="mt-1.5 text-sm font-medium text-gray-500 dark:text-red-200/80">This will delete all your audits. This cannot be undone.</div>
              </div>
              <button className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white" onClick={() => setDangerAction('erase')}>
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
  )
}
