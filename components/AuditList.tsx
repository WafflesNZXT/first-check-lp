'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProgressBar from '@/components/ProgressBar'
import { supabase } from '@/lib/supabase'

export default function AuditList({ initialAudits }: { initialAudits: any[] }) {
  const [audits, setAudits] = useState(initialAudits || [])

  useEffect(() => {
    const channel = supabase
      .channel('audit-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'audits' }, (payload) => {
        const updated = (payload as any)?.new
        if (!updated) return
        setAudits((prev: any[]) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="grid gap-4">
      {audits.map((audit) => (
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

          {audit.status === 'processing' && (
            <div className="w-full border-t border-gray-50 pt-4">
              <ProgressBar status={audit.status} />
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}