import Link from 'next/link';
import Nav from '@/components/Nav';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <Nav />

      <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Refund Policy</h1>
          <p className="text-gray-600 text-sm">Last updated: April 13, 2026</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed rounded-3xl border border-black/10 bg-white p-8 md:p-10 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Overview</h2>
            <p>We want you to feel confident trying audo Pro. This policy explains when refunds are available and how to request one.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Eligibility</h2>
            <p>We offer a one-time refund for first-time Pro subscriptions if requested within 7 days of the initial charge.</p>
            <p>Refunds are intended for early evaluation. Accounts with substantial usage during that period may not be eligible.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Renewals and Partial Periods</h2>
            <p>Subscription renewals are non-refundable unless required by applicable law.</p>
            <p>We do not provide prorated refunds for partial billing periods. You can cancel any time to avoid future charges.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">How to Request a Refund</h2>
            <p>Email <a href="mailto:wafi.syed5@gmail.com" className="text-blue-700 hover:text-black transition-colors">wafi.syed5@gmail.com</a> from your account email and include your purchase receipt or billing details.</p>
            <p>Approved refunds are sent back to the original payment method and typically appear within 5–10 business days, depending on your bank.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-black font-bold text-lg">Policy Updates</h2>
            <p>We may update this refund policy from time to time. Changes will be posted on this page with an updated date.</p>
          </section>

        </div>
      </div>
    </main>
  );
}
