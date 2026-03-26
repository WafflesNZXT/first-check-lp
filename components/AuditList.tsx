'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AuditList({ initialAudits }: { initialAudits: any[] }) {
  const [audits, setAudits] = useState(initialAudits || [])

  useEffect(() => {
    const channel = supabase
      .channel('audit-status')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audits' }, (payload) => {
        const inserted = (payload as any)?.new
        if (!inserted || inserted.status !== 'completed') return
        setAudits((prev: any[]) => {
          const exists = prev.some((a) => a.id === inserted.id)
          if (exists) return prev
          return [inserted, ...prev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audits' }, (payload) => {
        const updated = (payload as any)?.new
        if (!updated) return
        setAudits((prev: any[]) => {
          const exists = prev.some((a) => a.id === updated.id)
          if (!exists) {
            if (updated.status !== 'completed') return prev
            return [updated, ...prev]
          }

          const next = prev
            .map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
            .filter((a) => a.status === 'completed')

          return next
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const completedAudits = audits.filter((audit) => audit.status === 'completed')

  return (
    <div className="grid gap-4">
      {completedAudits.map((audit) => (
        <Link 
          href={`/dashboard/audit/${audit.id}`} 
          key={audit.id} 
          className="bg-white border border-gray-100 p-8 rounded-[2.5rem] flex flex-col gap-6 shadow-sm hover:border-black transition-all group"
        >
          <div className="flex justify-between items-start w-full">
            <div>
              <p className="font-bold text-xl text-black lowercase tracking-tight group-hover:underline">
                {String(audit.website_url || '').replace('https://', '')}
              </p>
              <p className="text-xs text-gray-400">{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : ''}</p>
            </div>

            {audit.status === 'completed' ? (
              <span className="px-4 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                completed
              </span>
            ) : (
              <span className="px-4 py-1 bg-yellow-50 text-yellow-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                processing
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}