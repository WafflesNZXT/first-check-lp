"use client";

import { useState } from 'react';
import { Check, Zap, ArrowRight, ShieldCheck, User, X } from 'lucide-react';
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
        window.location.href = "https://buy.stripe.com/aFa8wPfFF1y3ews7Gr0x200";
      }, 1200);
    } else {
      alert('Error: ' + res.error);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <Link href="/" className="font-bold text-xl tracking-tight">First Check</Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/#comparison" className="hover:text-white transition-colors">Comparison</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/pricing" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/10">Get Audit</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Simple, Founder-Friendly Pricing.</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">No subscriptions. No credit systems. Just human insight when you need it most.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Tier */}
          <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 hover:border-blue-500/30 transition-all group">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Most Popular</div>
            <div className="space-y-2">
              <div className="bg-gray-800 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-400">The Essentials</div>
              <h3 className="text-3xl font-bold">Deep-Dive Audit</h3>
              <p className="text-gray-400 text-sm">Perfect for pre-launch founders who need a gut-check.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold">$49</span>
              <span className="text-gray-500 font-medium">/audit</span>
            </div>
            <ul className="space-y-4">
              {[
                "10-Minute Video Screencast",
                "Full SEO & Metadata Audit",
                "Branding & UX Consistency Check",
                "Conversion Rate Optimization (CRO)",
                "The '5 Critical Fixes' Report"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-blue-500" /> {item}
                </li>
              ))}
            </ul>
            <button onClick={() => setModalOpen(true)} className="block w-full text-center bg-white text-black font-bold py-4 rounded-2xl hover:bg-blue-50 transition-all">
              Get Started
            </button>
          </div>

          {/* Expert Tier */}
          <div className="bg-blue-600/5 border-2 border-blue-600 rounded-3xl p-8 space-y-6 relative shadow-2xl shadow-blue-600/10 overflow-hidden">
            <div className="absolute z-20 left-[-6%] top-1/2 w-[112%] -translate-y-1/2 -rotate-12 pointer-events-none">
              <div className="mx-6 w-[calc(100%-1.5rem)] bg-yellow-300 text-black/90 text-center py-2 font-black uppercase tracking-widest shadow-md rounded-xl">Coming Soon</div>
            </div>
            <div className="space-y-2">
              <div className="bg-blue-600/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Investor Ready
              </div>
              <h3 className="text-3xl font-bold italic">The "Full Send"</h3>
              <p className="text-blue-100/60 text-sm">A human deep-dive plus the roadmap to your first $1k MRR.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-extrabold">$99</span>
              <span className="text-gray-500 font-medium">/audit</span>
            </div>
            <ul className="space-y-4">
              {[
                "Everything in Deep-Dive",
                "Investor Pitch-Deck Site Alignment",
                "Mobile Performance Deep-Scan",
                "Competitor Positioning Analysis",
                "Priority 24hr Turnaround"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white">
                  <Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> {item}
                </li>
              ))}
            </ul>
            <div className="opacity-60 pointer-events-none">
              <button className="block w-full text-center bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                Get Expert Audit
              </button>
            </div>
          </div>
        </div>

        <div className="mt-20 bg-white/5 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-blue-500">
               <User className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg italic">"I'll be the one personally auditing your site."</p>
              <p className="text-gray-500 text-sm">— Your Founder & Lead Auditor</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">12+</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Audits Done</div>
            </div>
            <div className="text-center border-l border-white/10 pl-4">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Satisfaction</div>
            </div>
          </div>
        </div>

      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative bg-[#0b0b0b] border border-white/10 rounded-2xl max-w-xl w-full p-8 shadow-2xl">
            <button className="absolute top-4 right-4 text-gray-400" onClick={() => setModalOpen(false)}><X className="w-5 h-5" /></button>
            {!submitted ? (
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <input type="text" name="honeypot" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Founder email</label>
                  <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Website URL</label>
                  <input name="website_url" type="url" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={isSubmitting} className="w-full bg-white text-black font-bold py-3 rounded-2xl">
                    {isSubmitting ? 'Processing...' : 'CLAIM THIS AUDIT — $49'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-600/20 flex items-center justify-center mb-6 border border-blue-500/30">
                  <Check className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Redirecting to payment...</h3>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
