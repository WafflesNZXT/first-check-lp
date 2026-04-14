'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import FeedbackModal from './FeedbackModal'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/components/Logo'

export default function SiteFooter() {
  const pathname = usePathname()
  const hideFooter = pathname === '/signin' || pathname === '/signup'
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (mounted && data?.user?.email) setUserEmail(data.user.email)
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  if (hideFooter) return null

  return (
    <>
      <footer className="w-full border-t border-black/10 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

            <div className="md:col-span-2 space-y-4">
              <Link href="/" aria-label="audo home" className="inline-flex text-black dark:text-white">
                <Logo size={44} className="text-black dark:text-white" />
              </Link>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-xs">
                Dashboard-first website auditing for startup teams. Run audits, prioritize fixes, and keep progress visible in one place.
              </p>
              {/* <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">
                By Wafi Syed
              </p> */}
            </div>

            <div className="space-y-4">
              <p className="text-black dark:text-white font-black text-xs uppercase tracking-widest">Product</p>
              <ul className="space-y-3">
                {[
                  { label: 'How it Works', href: '/#how-it-works' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Comparison', href: '/#comparison' },
                  { label: 'Get Access', href: '/pricing#get-audit' },
                  { label: 'Case Studies', href: '/case-studies' },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-black dark:text-white font-black text-xs uppercase tracking-widest">Company</p>
              <ul className="space-y-3">
                {[
                  { label: 'Contact', href: 'mailto:wafi.syed5@gmail.com' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Refund Policy', href: '/refund-policy' },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          <button onClick={() => setIsOpen(true)} className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
            Give Feedback
          </button>
          
          <div className="mt-16 pt-8 border-t border-black/10 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-black">
              © 2026 audo · The Pre-Launch Standard
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              Built by a founder, for founders.
            </p>
          </div>
        </div>
      </footer>

      <FeedbackModal userEmail={userEmail} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
