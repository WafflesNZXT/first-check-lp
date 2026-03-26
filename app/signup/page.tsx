import AuthForm from '@/components/AuthForm'
import Nav from '@/components/Nav'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#fcfcfc]">
      <Nav />
      <section className="flex flex-1 items-center justify-center px-6 pb-6 md:pb-8">
        <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-6 md:p-10 shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
          <AuthForm mode="signup" />
        </div>
      </section>
    </main>
  )
}