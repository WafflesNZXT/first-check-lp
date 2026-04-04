import AuthForm from '@/components/AuthForm'
import Nav from '@/components/Nav'
import { Suspense } from 'react'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#fcfcfc]">
      <Nav />

      <section className="flex-1">
        <div className="flex flex-col md:flex-row min-h-screen">

          {/* Left: full-bleed gradient with testimonial on top */}
          <div className="md:w-1/2 w-full relative flex items-start md:items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-600 to-blue-400 p-8">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(120%_80%_at_10%_10%,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_35%)]" />
            <div className="relative max-w-lg w-full">
              <div className="bg-white/6 border border-white/10 rounded-2xl p-6 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
                <p className="text-lg md:text-xl text-white font-semibold italic leading-relaxed">“Audo did actually help me catch stuff I completely overlooked. It's way more specific, and a lot more helpful than just a generic Lighthouse report.”</p>
                <p className="mt-4 text-sm font-bold text-white/90">— Founder, Dobda</p>
              </div>
            </div>
          </div>

          {/* Right: centered signup form on white canvas */}
          <div className="md:w-1/2 w-full flex items-center justify-center bg-white">
            <div className="w-full max-w-xl px-6 py-12">
              <div className="rounded-3xl border border-black/10 bg-white p-6 md:p-10 shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
                <Suspense>
                  <AuthForm mode="signup" />
                </Suspense>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}