"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import DashboardHeaderActions from '@/components/DashboardHeaderActions'

export default function SettingsClient({ email }: { email: string }) {
  const [showChangePw, setShowChangePw] = useState(false)
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [dangerAction, setDangerAction] = useState<null | 'delete' | 'erase'>(null)
  const [dangerMsg, setDangerMsg] = useState('')
  const [loading, setLoading] = useState(false)

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
      </div>
      </div>
    </div>
  )
}
