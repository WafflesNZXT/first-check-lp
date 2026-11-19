import AuthForm from '@/components/AuthForm'
import Nav from '@/components/Nav'
import { Suspense } from 'react'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col audo-auth-surface">
      <Nav />
      <section className="flex flex-1 items-center justify-center px-6 py-10 md:py-14">
        <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <Suspense>
            <AuthForm mode="signin" />
          </Suspense>
        </div>
      </section>
    </main>
  )
}