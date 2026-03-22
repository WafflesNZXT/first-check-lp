import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5">
        <Link href="/" aria-label="Home" className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
          First Check
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: March 22, 2026</p>
        </div>

        <div className="space-y-8 text-gray-400 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Agreement</h2>
            <p>By using First Check ("the Service"), you agree to these terms. The Service is operated by Wafi Syed. If you do not agree to these terms, do not use the Service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">The Service</h2>
            <p>First Check provides website audit reports covering performance, SEO, and accessibility. Audits are delivered manually by a human reviewer within 24 hours of payment. The free score tool provides automated scores using the Google PageSpeed Insights API and does not constitute a full audit.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Payment and Refunds</h2>
            <p>Payment is processed securely through Stripe. All sales are final once the audit report has been delivered. If you have not received your audit within 24 hours of payment, contact us at hello@firstcheck.dev and we will either deliver the report or issue a full refund.</p>
            <p>If you are unsatisfied with your audit, contact us within 48 hours of delivery and we will work to make it right. We stand behind the quality of our work.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">What You Receive</h2>
            <p>The Deep-Dive Audit includes a written report covering SEO, performance, accessibility, and UX observations, delivered via email. It also includes a 48-hour follow-up window for questions via direct message. The report is for your personal or business use and may not be resold.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Your Responsibilities</h2>
            <p>You must own or have permission to submit the URL you provide for auditing. You agree not to submit URLs for websites you do not own or have explicit permission to audit. You are responsible for implementing any recommendations in the audit report.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Disclaimer</h2>
            <p>Audit reports are based on publicly available tools and manual review. Recommendations are provided in good faith but we do not guarantee specific improvements to scores, rankings, or conversions as a result of implementing our recommendations. Results vary depending on your specific implementation.</p>
            <p>The free score tool provides automated data from Google PageSpeed Insights. Scores are estimates and may vary between runs.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, First Check shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability to you shall not exceed the amount you paid for the Service.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Changes to These Terms</h2>
            <p>We may update these terms from time to time. Any changes will be posted on this page with an updated date. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Governing Law</h2>
            <p>These terms are governed by the laws of Ontario, Canada. Any disputes shall be resolved in the courts of Ontario.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Contact</h2>
            <p>For any questions about these terms, email us at <a href="mailto:wafi.syed5@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">wafi.syed5@gmail.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}