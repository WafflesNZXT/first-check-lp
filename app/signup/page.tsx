import AuthForm from '@/components/AuthForm'
import Nav from '@/components/Nav'
import { Suspense } from 'react'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col audo-auth-surface">
      <Nav />
      <section className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-6 px-6 py-10 md:grid-cols-2 md:gap-10 md:py-14">
        <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-6 sm:p-9 md:order-2">
          <blockquote className="text-xl font-medium leading-relaxed tracking-tight text-slate-900">
            “Audo did actually help me catch stuff I completely overlooked. It’s way more specific, and a lot more helpful than just a generic Lighthouse report.”
          </blockquote>
          <p className="mt-4 text-sm font-medium text-blue-700">Founder, Dobda</p>
        </div>
        <div className="order-first w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
        </div>
      </section>
    </main>
  )
}
