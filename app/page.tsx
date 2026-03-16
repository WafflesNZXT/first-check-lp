"use client";

import { useState, useEffect } from 'react';
import { submitLead } from './actions';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false); // New state for success

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const res = await submitLead(formData);
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true); // Switch to success UI
    } else {
      alert("Error: " + res.error);
    }
  }

  if (!mounted) return <div className="min-h-screen bg-[#0a0a0a]" />;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-blue-600/20 blur-[120px] -z-10" />

      <div className="max-w-2xl text-center space-y-8 relative z-10">
        <div className="space-y-4">
          <span className="px-3 py-1 text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-full inline-block">
            {submitted ? "Success" : "Coming Soon: The Compliance Standard for Startups"}
          </span>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            {submitted ? "You're on the list." : "Get your startup investor-ready."}
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-lg mx-auto">
            {submitted 
              ? "We'll reach out shortly. Keep an eye on your inbox." 
              : "Stop guessing your SEO and Accessibility scores. Get a professional audit and remediation roadmap in 60 seconds."}
          </p>
        </div>

        {!submitted ? (
          <form 
            action={handleSubmit} 
            className="flex flex-col md:flex-row gap-3 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000"
          >
            <input
              name="email"
              type="email"
              placeholder="Your work email"
              required
              disabled={isSubmitting}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 min-w-[140px]"
            >
              {isSubmitting ? "Joining..." : "Get Early Access"}
            </button>
          </form>
        ) : (
          <div className="animate-in zoom-in duration-500 flex justify-center">
            <div className="h-16 w-16 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        <div className="pt-4">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            Join all the founders waiting for their first scan.
          </p>
        </div>
      </div>
    </main>
  );
}