"use client";

import { useState, useEffect } from 'react';
import { submitLead } from './actions';
import { 
  Check, X, Zap, DollarSign, Clock3, BrainCircuit, 
  Target, ArrowRight, Search, ShieldCheck, 
  Layout, BarChart3, MessageSquareText, Sparkles, Play 
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Smooth scroll helper with easing (decelerating at end)
  function smoothScrollTo(targetY: number, duration = 700) {
    const startY = window.scrollY || window.pageYOffset;
    const distance = targetY - startY;
    let startTime: number | null = null;

    function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);
      if (elapsed < duration) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function handleNavScroll(e: any, hash: string) {
    e.preventDefault();
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetY = window.scrollY + rect.top - 24; // small offset from top
    smoothScrollTo(targetY, 800);
    // update URL hash without jumping
    history.pushState(null, '', hash);
  }

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const res = await submitLead(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        window.location.href = "https://buy.stripe.com/aFa8wPfFF1y3ews7Gr0x200";
      }, 1500); 
    } else {
      alert("Error: " + res.error);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0a]" />;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 font-sans">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 relative z-20 font-sans">
        <div className="flex items-center">
          <Link href="/" aria-label="Home" className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-gray-500">
            First Check
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="#how-it-works" onClick={(e) => handleNavScroll(e as any, '#how-it-works')} className="hover:text-white transition-colors">How it Works</Link>
          <Link href="#comparison" onClick={(e) => handleNavScroll(e as any, '#comparison')} className="hover:text-white transition-colors">Comparison</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/pricing" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/10">Get Audit</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden font-sans">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-600/15 blur-[120px] -z-10 animate-pulse" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <span className="px-4 py-1.5 text-[10px] font-black border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full inline-flex items-center gap-2 uppercase tracking-[0.2em]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              24-Hour Human Deep-Dive
            </span>
            <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent leading-[0.95] py-2">
              Investor Ready. <br /> In 24 Hours.
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Ditch the generic bot reports. Get a <span className="text-white font-medium">manual ruthless audit</span> of your startup's landing page flaws from a human founder.
            </p>
          </div>

          {!submitted ? (
            <div className="max-w-md mx-auto pt-4">
              <form action={handleSubmit} className="space-y-4 text-left">
                <input type="text" name="honeypot" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                <div className="flex flex-col gap-3">
                  <input
                    name="email" type="email" placeholder="Founder email" required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-gray-600"
                  />
                  <input
                    name="website_url" type="url" placeholder="https://yourstartup.com" required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder:text-gray-600"
                  />
                  <button
                    type="submit" disabled={isSubmitting}
                    className="w-full bg-white text-black font-black px-6 py-5 rounded-2xl hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-xl"
                  >
                    {isSubmitting ? "Syncing..." : "GET MY RUTHLESS AUDIT — $49"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="py-20 animate-in fade-in zoom-in duration-700 flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/40 mb-6 shadow-2xl shadow-blue-500/20">
                    <Check className="w-10 h-10 text-blue-400" strokeWidth={3} />
                </div>
                <h3 className="text-3xl font-bold tracking-tight">Handing you over to Stripe...</h3>
            </div>
          )}
        </div>
      </section>

      {/* NEW: THE THREE PILLARS (Tutorly Style) */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Ruthless Analysis", desc: "I don't hold back. If your copy is weak or your CTA is hidden, I'll tell you exactly how to fix it." },
            { icon: ShieldCheck, title: "Investor Standard", desc: "I check the 'boring' stuff investors look for: Accessibility, Speed, and Technical Compliance." },
            { icon: Sparkles, title: "Conversion First", desc: "At the end of the day, your site exists to sell. Every tip I give is aimed at increasing your conversion rate." }
          ].map((item, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
              <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="text-xl font-bold mb-3">{item.title}</h4>
              <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW: HOW IT WORKS (Tutorly Style) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black leading-none">The 24-hour <br /> Turnaround.</h2>
              <p className="text-blue-100/80 text-lg">We move at startup speed. No meetings, no long emails. Just results.</p>
              <div className="space-y-4 pt-4">
                {[
                  { step: "01", text: "Submit your URL and pay the one-time fee." },
                  { step: "02", text: "I perform a manual deep-dive on your platform." },
                  { step: "03", text: "You receive a custom video + PDF roadmap via email." }
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 text-white">
                    <span className="font-black text-2xl opacity-30">{s.step}</span>
                    <span className="font-bold text-lg">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                <div className="space-y-4">
                    <div className="h-2 w-24 bg-blue-400 rounded-full" />
                    <div className="h-4 w-full bg-white/10 rounded-full" />
                    <div className="h-4 w-3/4 bg-white/10 rounded-full" />
                    <div className="pt-6 grid grid-cols-2 gap-4">
                        <div className="h-20 bg-white/5 rounded-2xl border border-white/5" />
                        <div className="h-20 bg-white/5 rounded-2xl border border-white/5" />
                    </div>
                    <div className="pt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-200">
                        <span>Analysis Processing</span>
                        <span className="animate-pulse">94% Complete</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPONENT: COMPARISON TABLE */}
      <section id="comparison" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Built for Founders, <span className="text-gray-600">not Agencies.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 bg-[#111] border-2 border-blue-600 rounded-3xl p-8 relative shadow-2xl shadow-blue-900/20 transform transition-all duration-300 hover:-translate-y-2">
            <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Optimal Choice</div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
              <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20"><Zap className="w-8 h-8 text-blue-400" /></div>
              <div><h3 className="text-2xl font-bold">First Check</h3><p className="text-sm text-gray-500">The Human Audit</p></div>
            </div>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> SEO + WCAG + Security</li>
              <li className="flex items-center gap-3 text-white"><Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> Founder-to-Founder Advice</li>
              <li className="flex items-center gap-3 text-white font-bold"><Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> Ruthless Checklist ⚡</li>
            </ul>
          </div>

          {[
            { name: "Ahrefs", price: "$129/mo+", icon: DollarSign, features: ["Restrictive 'Credit' system", "Complex backlink data", "No UX / Human insight"] },
            { name: "SEMrush", price: "$117/mo+", icon: BrainCircuit, features: ["Massive feature bloat", "Paid add-ons for AI", "Built for SEO agencies"] },
            { name: "SimilarWeb", price: "$125/mo+", icon: Target, features: ["Market research focus", "Confusing pricing tiers", "No technical UX audit"] },
          ].map((comp, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col opacity-60 hover:opacity-100 transition-all">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="bg-white/5 p-4 rounded-2xl"><comp.icon className="w-8 h-8 text-gray-600" /></div>
                <div><h3 className="text-xl font-semibold text-gray-300">{comp.name}</h3><p className="text-lg font-bold text-gray-700">{comp.price}</p></div>
              </div>
              <ul className="space-y-4 text-xs font-medium text-gray-600">
                {comp.features.map((feat, fidx) => (
                  <li key={fidx} className="flex items-start gap-3"><X className="w-4 h-4 text-red-900/40 mt-0.5" /> {feat}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* NEW: THE "BENTO" GRID (Tutorly Style) */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-12 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Manual Video Walkthrough.</h3>
                <p className="text-gray-400 max-w-sm">I don't just send a PDF. I record a 10-minute screencast talking through your site like a user (and an investor) would.</p>

                <div className="mt-8">
                  <div className="relative bg-gradient-to-b from-blue-600 to-blue-800 h-64 w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_#ffffff10,_#0000)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/25 w-20 h-20 rounded-full flex items-center justify-center hover:scale-100 transition-transform">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="absolute top-4 left-4 text-xs font-bold text-white/95 bg-black/25 px-3 py-1 rounded-full">Manual Walkthrough · 10:32</div>
                    <div className="absolute bottom-12 left-4 text-sm text-white/90">Key takeaway: Headline clarity + stronger CTA</div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: '26%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-12 flex flex-col items-start text-left space-y-6">
              <div className="w-14 h-14 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/10">
                <MessageSquareText className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold">Direct Access.</h3>
              <p className="text-sm text-gray-400">Every audit includes a 48-hour window where you can ask follow-up questions via DM.</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> Timestamped chapters and highlights</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> Annotated notes + prioritized PDF roadmap</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> 48-hour follow-up for clarifications</li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-blue-400 mt-1" /> Actionable fixes you can ship in days</li>
              </ul>
              <Link href="/pricing" className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition">Get audit</Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA*/}
      <section className="max-w-7xl mx-auto px-6 py-32 text-center">
        <div className="relative z-10 space-y-10">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter">Ready to ship?</h2>
          <Link href="/pricing" className="inline-flex items-center gap-3 bg-white text-black px-12 py-6 rounded-full font-black text-xl hover:bg-blue-600 hover:text-white transition-all shadow-2xl">
             CLAIM YOUR AUDIT NOW <ArrowRight className="w-6 h-6" />
          </Link>
          <div className="flex justify-center gap-8 text-gray-600 font-bold text-xs uppercase tracking-widest pt-8">
            <span>Verified 24hr Turnaround</span>
            <span>Founder Reviewed</span>
            <span>No Subscription</span>
          </div>
        </div>
      </section>
    </main>
  );
}