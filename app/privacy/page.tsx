import Link from 'next/link';
import Nav from '@/components/Nav';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white text-black font-sans">
      <Nav />

      <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-gray-600 text-sm">Last updated: March 22, 2026</p>
        </div>

        <div className="space-y-8 text-gray-700 leading-relaxed rounded-3xl border border-black/10 bg-white p-8 md:p-10 shadow-[0_12px_30px_rgba(0,0,0,0.04)]">

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Overview</h2>
            <p>audo (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is operated by Wafi Syed. We take your privacy seriously. This policy explains what information we collect, how we use it, and what rights you have over it.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Information We Collect</h2>
            <p>When you create an account, we collect your email address and authentication details managed through our auth provider. When you run audits, we collect the URLs you submit and related audit metadata required to provide dashboard features.</p>
            <p>When you use the free score tool, we receive the URL you submit for processing. Free score submissions may be processed without account-level history.</p>
            <p>We use Vercel Analytics to understand general traffic patterns on our site. This collects anonymized data such as page views and referral sources. No personally identifiable information is collected through analytics.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">How We Use Your Information</h2>
            <p>We use your information to authenticate your account, provide dashboard access, run audits, and support your use of the service. We do not add you to marketing lists without your explicit consent. We do not sell or rent your personal information.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Payments</h2>
            <p>All payments are processed by Stripe. We do not store or have access to your payment card details. Stripe's privacy policy applies to all payment transactions. You can review it at stripe.com/privacy.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Third Party Services</h2>
            <p>We use the Google PageSpeed Insights API to generate performance scores. When you submit a URL through our free score tool, that URL is sent to Google's API for analysis. Google's privacy policy applies to this data. We do not send any personal information to Google as part of this process.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Cookies</h2>
            <p>We use session storage (not cookies) to remember if you have dismissed the announcement bar. This data lives only in your browser and is cleared when you close your tab. We do not use tracking cookies or advertising cookies of any kind.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Your Rights</h2>
            <p>You have the right to request access to, correction of, or deletion of any personal information we hold about you. To make a request, email us at hello@firstcheck.dev and we will respond within 30 days.</p>
          </section>

          <section className="space-y-3 pb-6 border-b border-black/10">
            <h2 className="text-black font-bold text-lg">Changes to This Policy</h2>
            <p>We may update this policy from time to time. Any changes will be posted on this page with an updated date. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-black font-bold text-lg">Contact</h2>
            <p>If you have any questions about this privacy policy, email us at <a href="mailto:wafi.syed5@gmail.com" className="text-blue-700 hover:text-black transition-colors">wafi.syed5@gmail.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}