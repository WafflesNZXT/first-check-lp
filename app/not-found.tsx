import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="audo-auth-surface grid min-h-[70vh] place-items-center px-6 py-20">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-medium text-blue-700">Error 404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">The page you’re looking for doesn’t exist or may have moved.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          Back to home
        </Link>
      </section>
    </main>
  );
}
