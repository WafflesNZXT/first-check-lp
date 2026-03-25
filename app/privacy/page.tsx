import Link from 'next/link';
import Nav from '@/components/Nav';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Nav />

      <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: March 22, 2026</p>
        </div>

        <div className="space-y-8 text-gray-400 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Overview</h2>
            <p>First Check ("we", "us", or "our") is operated by Wafi Syed. We take your privacy seriously. This policy explains what information we collect, how we use it, and what rights you have over it.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Information We Collect</h2>
            <p>When you request an audit, we collect your email address and the URL of your website. This is the only personal information we collect directly.</p>
            <p>When you use the free score tool, we receive the URL you submit. We do not store this URL beyond the immediate request and do not link it to any personal identity.</p>
            <p>We use Vercel Analytics to understand general traffic patterns on our site. This collects anonymized data such as page views and referral sources. No personally identifiable information is collected through analytics.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">How We Use Your Information</h2>
            <p>Your email address is used solely to deliver your audit report and follow up on your order. We do not add you to marketing lists without your explicit consent. We do not sell, rent, or share your personal information with third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Payments</h2>
            <p>All payments are processed by Stripe. We do not store or have access to your payment card details. Stripe's privacy policy applies to all payment transactions. You can review it at stripe.com/privacy.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Third Party Services</h2>
            <p>We use the Google PageSpeed Insights API to generate performance scores. When you submit a URL through our free score tool, that URL is sent to Google's API for analysis. Google's privacy policy applies to this data. We do not send any personal information to Google as part of this process.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Cookies</h2>
            <p>We use session storage (not cookies) to remember if you have dismissed the announcement bar. This data lives only in your browser and is cleared when you close your tab. We do not use tracking cookies or advertising cookies of any kind.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Your Rights</h2>
            <p>You have the right to request access to, correction of, or deletion of any personal information we hold about you. To make a request, email us at hello@firstcheck.dev and we will respond within 30 days.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Changes to This Policy</h2>
            <p>We may update this policy from time to time. Any changes will be posted on this page with an updated date. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-white font-bold text-lg">Contact</h2>
            <p>If you have any questions about this privacy policy, email us at <a href="mailto:wafi.syed5@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">wafi.syed5@gmail.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  );
}