'use client'

import React from 'react'

export default function TrustedByCarousel() {
  const logos = new Array(6).fill(0)

  return (
    <div className="max-w-6xl mx-auto mt-10 md:mt-12 mb-12 md:mb-16 z-20 relative">
      <style>{`
        @keyframes fc-marquee { from { transform: translateX(0%); } to { transform: translateX(-50%); } }
        .fc-marquee { animation: fc-marquee 28s linear infinite; }
        .fc-marquee:hover { animation-play-state: paused; }

        /* keep logos grayscale by default, only remove filter for the single hovered logo */
        .fc-marquee .logo > * { filter: grayscale(100%) brightness(0.7); transition: filter 220ms ease, transform 220ms ease; }
        .fc-marquee .logo:hover > * { filter: none !important; }
        .fc-marquee .logo { cursor: pointer; transition: transform 220ms ease; }
        .fc-marquee .logo:hover { transform: translateY(-3px) scale(1.02); z-index: 10; }
      `}</style>

      <div className="px-4 md:px-6 py-3 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm overflow-hidden">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Trusted by</p>

        <div className="w-full overflow-hidden">
          <div className="fc-marquee flex items-center gap-8 w-[200%]">
            <div className="flex items-center gap-8">
              {logos.map((_, i) => (
                <div key={`l-${i}`} className="flex items-center justify-center w-48 h-12 flex-shrink-0 opacity-95">
                  <div className="logo group flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-sm flex-shrink-0" style={{background:'#f59e0b'}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="3" fill="#b45309" />
                      </svg>
                    </div>
                    <div className="text-sm font-bold tracking-wider text-white uppercase">
                      ONTOLOGY
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-8">
              {logos.map((_, i) => (
                <div key={`r-${i}`} className="flex items-center justify-center w-48 h-12 flex-shrink-0 opacity-95">
                  <div className="logo group flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-sm flex-shrink-0" style={{background:'#f59e0b'}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="3" fill="#b45309" />
                      </svg>
                    </div>
                    <div className="text-sm font-bold tracking-wider text-white uppercase">
                      ONTOLOGY
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* no global hover rule here — keep highlight scoped to the hovered logo only */}
    </div>
  )
}
