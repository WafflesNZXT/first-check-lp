"use client";

import { useState, useEffect } from 'react';
import { submitLead } from './actions';
import { Check, X, Zap, DollarSign, Clock3, BrainCircuit, Target } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [priceType, setPriceType] = useState<'monthly' | 'one-time'>('one-time');
  const [priceValue, setPriceValue] = useState(29);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const res = await submitLead(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      alert("Error: " + res.error);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0a]" />;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-600/20 blur-[120px] -z-10" />

      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        <div className="space-y-4">
          <span className="px-3 py-1 text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full inline-block">
            {submitted ? "Success" : "Coming Soon: The Compliance Standard for Startups"}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {submitted ? "You're on the list." : "Get your startup investor-ready."}
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            {submitted 
              ? "We'll reach out shortly. Keep an eye on your inbox." 
              : "Stop guessing your SEO and Accessibility scores. Get a professional roadmap in 60 seconds."}
          </p>
        </div>
        {/* Close the small intro container so the comparison grid can be full-width */}
      </div>
              
              {/* Detailed Comparison Section */}
              <div className="mt-28 max-w-6xl w-full mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Built for Founders, <span className="text-gray-600">not Agencies.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stop overpaying for 500 features you don't need. Get the 60-second Roadmap that actually makes you investor-ready.
          </p>
        </div>

        {/* The Grid Container - Responsive! Stacks on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
          
          {/* --- FIRST-CHECK (Highlighted Card) --- */}
          <div className="md:col-span-1 bg-[#111] border-2 border-blue-600 rounded-3xl p-8 relative shadow-2xl shadow-blue-900/20 group transform transition-all duration-300 hover:-translate-y-2 flex flex-col h-full border-l-4 border-blue-500/40 pl-6">
            {/* Pulsing Accent Badge */}
            <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-100"></span>
              </span>
              Optimal Choice
            </div>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
              {/* Custom Zap Icon */}
              <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                <Zap className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">First-Check</h3>
                <p className="text-sm text-gray-500">The Startup Standard</p>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">The only tool built to get founders compliant and fundraising-ready in minutes.</p>

            <ul className="space-y-4 text-sm font-medium mt-auto">
              <li className="flex items-center gap-3 text-white">
                <Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> SEO + WCAG + Security
              </li>
              <li className="flex items-center gap-3 text-white">
                <Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> 60s Founder Roadmap
              </li>
              <li className="flex items-center gap-3 text-white">
                <Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> Zero learning curve
              </li>
              <li className="flex items-center gap-3 text-white">
                <Check className="w-5 h-5 text-blue-400" strokeWidth={3} /> You set the price ⚡
              </li>
            </ul>
          </div>

          {/* --- THE COMPETITORS (Grayed Cards) --- */}
          {[
            { name: "Ahrefs", price: "$129/mo+", icon: DollarSign, features: ["Restrictive 'Credit' system", "Complex backlink data", "No WCAG / Accessibility", "Steep learning curve"] },
            { name: "SEMrush", price: "$117/mo+", icon: BrainCircuit, features: ["Massive feature bloat", "Paid add-ons for AI", "Built for SEO agencies", "Enterprise-only reporting"] },
            { name: "SimilarWeb", price: "$125/mo+", icon: Target, features: ["Market research focus", "Confusing pricing tiers", "Limited technical audit", "Built for Analysts"] },
          ].map((comp, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5 opacity-60">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <comp.icon className="w-8 h-8 text-gray-400" strokeWidth={1} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-300">{comp.name}</h3>
                  <p className="text-lg font-bold text-gray-600">{comp.price}</p>
                </div>
              </div>

              <ul className="space-y-4 text-xs font-medium text-gray-600 mt-auto">
                {comp.features.map((feat, fidx) => (
                  <li key={fidx} className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-900/60 mt-0.5" strokeWidth={3} /> {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The Bottom Feature Breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center opacity-80">
            {[
                {icon: Zap, title: "Speed to Clarity", desc: "Get a prioritized checklist in 60s, not hours parsing giant spreadsheets."},
                {icon: Clock3, title: "Founder's Context", desc: "Audit results explained in simple business logic, not technical jargon."},
                {icon: Target, title: "Investment-Ready", desc: "The only report built to show investors you've mastered the boring stuff."}
            ].map((item, i) => (
                <div key={i} className={`flex flex-col items-center space-y-3 pt-6 md:pt-0 ${i > 0 ? 'md:pl-8' : ''}`}>
                    <item.icon className="w-8 h-8 text-blue-400 mb-1" />
                    <h4 className="font-bold text-white text-lg">{item.title}</h4>
                    <p className="text-sm text-gray-500 max-w-xs">{item.desc}</p>
                </div>
            ))}
        </div>

        {!submitted ? (
          <form action={handleSubmit} className="max-w-md mx-auto space-y-6 text-left">
            <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

            <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Target Price</label>
                <div className="flex bg-black rounded-lg p-1 border border-white/10">
                  <button 
                    type="button"
                    onClick={() => setPriceType('one-time')}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${priceType === 'one-time' ? 'bg-white text-black' : 'text-gray-500'}`}
                  >Once</button>
                  <button 
                    type="button"
                    onClick={() => setPriceType('monthly')}
                    className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${priceType === 'monthly' ? 'bg-white text-black' : 'text-gray-500'}`}
                  >Monthly</button>
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  type="range" min="5" max="200" step="5"
                  value={priceValue}
                  onChange={(e) => setPriceValue(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="text-center">
                  <span className="text-4xl font-bold text-white">${priceValue}</span>
                  <span className="text-gray-500 ml-1">/{priceType === 'monthly' ? 'mo' : 'per check'}</span>
                </div>
              </div>

              <input type="hidden" name="price_amount" value={priceValue} />
              <input type="hidden" name="price_type" value={priceType} />
            </div>

            <div className="flex flex-col gap-3">
              <input
                name="email"
                type="email"
                placeholder="Your email"
                required
                disabled={isSubmitting}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black font-bold px-6 py-4 rounded-xl hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Joining..." : "Get Early Access"}
              </button>
            </div>
          </form>
        ) : (
          <div className="animate-in zoom-in duration-500 flex flex-col items-center pt-8">
            <div className="h-20 w-20 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        <div className="pt-8 text-xs text-gray-500 flex items-center justify-center gap-2">
           <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0a0a0a] bg-gray-800" />
              ))}
            </div>
            <span>Join all the founders like you waiting for their first scan.</span>
        </div>
      </div>
    </main>
  );
}