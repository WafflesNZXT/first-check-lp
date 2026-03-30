import React from "react";

export default function Partners() {
  return (
    <section className="w-full py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h2
          className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 text-center"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.15em' }}
        >
          Trusted by forward-thinking founders
        </h2>
        <div className="flex gap-6 overflow-x-auto scrollbar-hide py-2 px-1 md:justify-center">
          {/* Partner 1 */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
              <span className="text-gray-600 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>0x1Live</span>
            </div>
            <span className="text-xs text-gray-400">0x1Live</span>
          </div>
          {/* Partner 2 */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
              <span className="text-gray-600 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>LeadSynthAI</span>
            </div>
            <span className="text-xs text-gray-400">LeadSynthAI</span>
          </div>
          {/* Placeholder 3 */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-gray-300 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Logo</span>
            </div>
            <span className="text-xs text-gray-300">Partner</span>
          </div>
          {/* Placeholder 4 */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-gray-300 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Logo</span>
            </div>
            <span className="text-xs text-gray-300">Partner</span>
          </div>
          {/* Placeholder 5 */}
          <div className="flex flex-col items-center min-w-[120px]">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-gray-300 text-lg font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Logo</span>
            </div>
            <span className="text-xs text-gray-300">Partner</span>
          </div>
        </div>
      </div>
    </section>
  );
}
