"use client";

import { useState } from 'react';
import { Check, Zap, ArrowRight, ShieldCheck, X, FileText, Search, MessageSquareText, BarChart3, Sparkles, Linkedin } from 'lucide-react';
import Link from 'next/link';
import { submitLead } from '../actions';

export default function Pricing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleModalSubmit(e: any) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    setIsSubmitting(true);
    const res = await submitLead(formData);
    setIsSubmitting(false);
    if (res.success) {
      setSubmitted(true);
      setTimeout(() => {
        window.location.href = "https://buy.stripe.com/00wfZh0KLccHdso1i30x202";
      }, 1200);
    } else {
      alert('Error: ' + res.error);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 relative z-20 font-sans">
        <div className="flex items-center">
          <Link href="/" aria-label="Home" className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
            First Check
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/#comparison" className="hover:text-white transition-colors">Comparison</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/pricing" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/10">Get Audit</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-24">

        {/* Header */}
        <div className="text-center space-y-4 mb-20">
          <span className="px-4 py-1.5 text-[10px] font-black border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full inline-flex items-center gap-2 uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Simple Pricing
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">One price. No surprises.</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">No subscriptions. No credit systems. Just a human founder auditing your site and telling you exactly what to fix.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Main Tier */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-[2rem] opacity-20 group-hover:opacity-40 blur transition duration-500" />
            <div className="relative bg-[#0f0f0f] border border-white/10 rounded-[1.75rem] p-8 space-y-8">
              
              {/* Badge */}
              <div className="flex items-center justify-between">
                <div className="bg-blue-600/20 border border-blue-500/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400">Most Popular</div>
                <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-green-400">Available Now</div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold tracking-tight">Deep-Dive Audit</h3>
                <p className="text-gray-500 text-sm leading-relaxed">A ruthless, manual audit of your startup's site. Delivered in 24 hours by a real founder.</p>
              </div>

              {/* Price */}
              <div className="flex items-end gap-2 pb-2 border-b border-white/5">
                <span className="text-6xl font-black tracking-tighter">$29</span>
                <div className="pb-2 space-y-0.5">
                  <span className="text-gray-500 font-medium text-sm block">/audit</span>
                  <span className="text-gray-700 text-xs block">one-time payment</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4">
                {[
                  { icon: Search, text: "Full SEO & Metadata Audit" },
                  { icon: BarChart3, text: "Performance & Accessibility Scores" },
                  { icon: Sparkles, text: "Branding & UX Consistency Check" },
                  { icon: FileText, text: "Prioritized Fix Report — Plain English" },
                  { icon: MessageSquareText, text: "48-Hour Follow-Up Window" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm text-gray-300">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-blue-400" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => setModalOpen(true)}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-black/20"
              >
                Get My Audit
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-gray-700 text-xs">Delivered within 24 hours. No subscription required.</p>
            </div>
          </div>

          {/* Coming Soon Tier */}
          <div className="relative opacity-70">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] opacity-10 blur" />
            <div className="relative bg-[#0f0f0f] border border-white/5 rounded-[1.75rem] p-8 space-y-8 overflow-hidden">
              
              {/* Coming soon ribbon */}
              <div className="absolute z-20 right-[-28px] top-[28px] rotate-45 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest px-10 py-1.5 shadow-lg">
                Coming Soon
              </div>

              {/* Badge */}
              <div className="flex items-center justify-between">
                <div className="bg-purple-600/20 border border-purple-500/20 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Investor Ready
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h3 className="text-3xl font-extrabold tracking-tight italic">The "Full Send"</h3>
                <p className="text-gray-500 text-sm leading-relaxed">Everything in Deep-Dive, plus competitor analysis, pitch-deck alignment, and a roadmap to your first $1k MRR.</p>
              </div>

              {/* Price */}
              <div className="flex items-end gap-2 pb-2 border-b border-white/5">
                <span className="text-6xl font-black tracking-tighter">$99</span>
                <div className="pb-2 space-y-0.5">
                  <span className="text-gray-500 font-medium text-sm block">/audit</span>
                  <span className="text-gray-700 text-xs block">one-time payment</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4">
                {[
                  { icon: Check, text: "Everything in Deep-Dive" },
                  { icon: Check, text: "Investor Pitch-Deck Alignment" },
                  { icon: Check, text: "Mobile Performance Deep-Scan" },
                  { icon: Check, text: "Competitor Positioning Analysis" },
                  { icon: Check, text: "Priority 24hr Turnaround" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-gray-600" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>

              {/* Disabled CTA */}
              <div className="pointer-events-none">
                <button className="w-full bg-white/5 text-gray-600 font-black py-4 rounded-2xl border border-white/5 cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Auditor Trust Strip */}
        <div className="mt-16 bg-white/[0.02] border border-white/5 rounded-3xl p-10 md:p-12 md:min-h-[180px] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-blue-500/50 overflow-hidden flex-shrink-0">
              <img src="/1770612376028.jfif" alt="Wafi Syed" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-bold italic text-lg">"I'll personally audit your site within 24 hours."</p>
              <p className="text-gray-500 text-sm mt-0.5">Wafi Syed, Founder of First Check</p>
              <div className="mt-2">
                <a href="https://www.linkedin.com/in/wafisyed/" target="_blank" rel="noopener noreferrer" aria-label="Wafi Syed on LinkedIn" className="inline-flex items-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-600 p-2.5 hover:bg-blue-500 transition-colors">
                    <Linkedin className="w-5 h-5 text-white" />
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex gap-6 flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold">7+</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Audits Done</div>
            </div>
            <div className="text-center border-l border-white/10 pl-6">
              <div className="text-2xl font-bold">4/5</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Avg Rating</div>
            </div>
            <div className="text-center border-l border-white/10 pl-6">
              <div className="text-2xl font-bold">24hr</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Turnaround</div>
            </div>
          </div>
        </div>

        {/* FAQ Strip */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { q: "What do I actually get?", a: "A detailed written audit with prioritized fixes covering SEO, performance, accessibility, and UX observations." },
            { q: "How long does it take?", a: "Your audit is delivered within 24 hours of payment. You also get a 48-hour follow-up window for questions." },
            { q: "Who does the audit?", a: "Wafi Syed personally audits every site. No bots, no outsourcing, no automated reports." },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-2">
              <p className="text-white font-bold text-sm">{item.q}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <button className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors" onClick={() => setModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            {!submitted ? (
              <form onSubmit={handleModalSubmit} className="space-y-6">
                <input type="text" name="honeypot" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Claim your audit</h3>
                  <p className="text-gray-500 text-sm">You'll be redirected to payment. Audit delivered within 24 hours.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Founder email</label>
                    <input name="email" type="email" required placeholder="you@startup.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Website URL</label>
                    <input name="website_url" type="url" required placeholder="https://yourstartup.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-600" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? 'Processing...' : 'CLAIM THIS AUDIT — $29'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-gray-700 text-xs">One-time payment. No subscription.</p>
              </form>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Check className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Redirecting to payment...</h3>
                <p className="text-gray-500 text-sm">Hang tight, you'll be with Stripe in a second.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}