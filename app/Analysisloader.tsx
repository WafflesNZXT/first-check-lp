"use client";

import { useEffect, useState } from 'react';

const STEPS = [
  { label: "Connecting to your site...", duration: 2000 },
  { label: "Running performance checks...", duration: 4000 },
  { label: "Analyzing SEO metadata...", duration: 3000 },
  { label: "Checking accessibility...", duration: 3000 },
  { label: "Identifying issues...", duration: 3000 },
  { label: "Preparing your report...", duration: 2000 },
];

export function AnalysisLoader() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let currentStep = 0;
    let currentProgress = 0;
    const totalDuration = STEPS.reduce((acc, s) => acc + s.duration, 0);
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      currentProgress = Math.min((elapsed / totalDuration) * 95, 95); // Cap at 95 — real result fills to 100
      setProgress(currentProgress);

      // Advance step label
      let stepElapsed = 0;
      for (let i = 0; i < STEPS.length; i++) {
        stepElapsed += STEPS[i].duration;
        if (elapsed < stepElapsed) {
          setStepIndex(i);
          break;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 py-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">{STEPS[stepIndex]?.label}</span>
          <span className="text-blue-400 font-black">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Performance", done: stepIndex >= 1 },
          { label: "SEO", done: stepIndex >= 2 },
          { label: "Accessibility", done: stepIndex >= 3 },
        ].map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold border transition-all duration-500 ${
              item.done
                ? 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                : 'bg-[#141414] border-white/5 text-gray-600'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.done ? 'bg-blue-400' : 'bg-gray-700'}`} />
            {item.label}
          </div>
        ))}
      </div>

      <p className="text-gray-700 text-[10px] text-center">
        This usually takes 10–20 seconds. Hang tight!
      </p>
    </div>
  );
}