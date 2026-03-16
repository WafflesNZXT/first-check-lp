"use client";

import { useState, useEffect } from 'react';
import { submitLead } from './actions';

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
              ? "We'll reach out shortly to run your first manual audit. Keep an eye on your inbox." 
              : "Stop guessing your SEO and Accessibility scores. Get a professional roadmap in 60 seconds."}
          </p>
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