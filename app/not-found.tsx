import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[112svh] pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 bg-[linear-gradient(122deg,rgba(8,47,73,0.92)_0%,rgba(30,64,175,0.8)_34%,rgba(219,234,254,0.32)_58%,rgba(24,24,27,0.55)_74%,rgba(10,10,10,0.88)_88%,rgba(10,10,10,1)_100%)]" />
      </div>

      <section className="relative z-10 min-h-screen px-6 flex items-center justify-center">
        <div className="w-full max-w-xl text-center space-y-6 bg-black/45 border border-white/20 rounded-3xl p-10 backdrop-blur-sm shadow-2xl shadow-black/40">
          <p className="text-blue-300 text-xs font-black uppercase tracking-[0.2em]">Error 404</p>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">Page Not Found</h1>
          <p className="text-gray-200 text-sm md:text-base leading-relaxed">
            The page you’re looking for doesn’t exist or may have been moved.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-white text-black border border-white font-black px-8 py-3 rounded-2xl hover:bg-blue-500 hover:text-white hover:border-blue-400 transition-all active:scale-95"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}