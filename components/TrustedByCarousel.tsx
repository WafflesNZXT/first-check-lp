'use client'

import React from 'react'

export default function TrustedByCarousel() {
  const logos = [
    { key: 'ontology', label: 'Ontology' },
    { key: 'dobda', label: 'Dobda' },
    { key: 'inobex', label: 'Inobex' },
  ]

  const renderLogo = (logo: { key: string; label: string }) => {
    if (logo.key === 'dobda') {
      return (
        <>
          <div className="flex items-center justify-center w-12 h-12 rounded-sm flex-shrink-0" style={{ background: '#f3e0d0' }}>
            <div style={{ width: 26, height: 26, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: 20, height: 16, borderRadius: 6, background: '#f2c9a8' }} />
              <div style={{ position: 'absolute', right: -2, bottom: -2, width: 12, height: 12, borderRadius: 12, background: '#f05252', boxShadow: '0 0 0 3px rgba(240,82,82,0.06)' }} />
            </div>
          </div>
          <div className="text-sm font-bold tracking-wider text-white">{logo.label}</div>
        </>
      )
    }

    if (logo.key === 'inobex') {
      return (
        <>
          <div className="flex items-center justify-center w-12 h-10 flex-shrink-0">
            <img src="/inobex-logo.svg" alt="Inobex" className="w-12 h-10 object-contain" />
          </div>
          <div className="text-sm font-bold tracking-wider text-[#0ea5e9]">{logo.label}</div>
        </>
      )
    }

    // default simple mark + label (keeps visuals consistent)
    return (
      <>
        <div className="flex items-center justify-center w-10 h-10 rounded-sm flex-shrink-0" style={{ background: '#111827' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" fill="#374151" />
          </svg>
        </div>
        <div className="text-sm font-semibold tracking-wider text-white">{logo.label}</div>
      </>
    )
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 md:mt-12 mb-12 md:mb-16 z-20 relative">
      <style>{`
        @keyframes fc-marquee { from { transform: translateX(0%); } to { transform: translateX(-50%); } }
        .fc-marquee { animation: fc-marquee 28s linear infinite; }
        .fc-marquee:hover { animation-play-state: paused; }

        /* show full color by default */
        .fc-marquee .logo > * { filter: none; transition: filter 220ms ease, transform 220ms ease; }
        /* when the marquee is hovered, dim all non-hovered logos */
        .fc-marquee:hover .logo:not(:hover) > * { filter: grayscale(100%) brightness(0.6); }

        /* sizing helpers for SVG/img inside logos */
        .fc-marquee .logo img, .fc-marquee .logo svg { height: 34px; width: auto; }

        .fc-marquee .logo { cursor: pointer; transition: transform 220ms ease; }
        .fc-marquee .logo:hover { transform: translateY(-3px) scale(1.02); z-index: 10; }
      `}</style>

      <div className="px-4 md:px-6 py-3 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm overflow-hidden">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Trusted by</p>

        <div className="w-full overflow-hidden">
          <div className="fc-marquee flex items-center gap-8 w-[200%]">
            <div className="flex items-center gap-8">
              {logos.map((logo, i) => (
                <div key={`l-${i}`} className="flex items-center justify-center w-56 h-14 flex-shrink-0 opacity-95">
                  <div className="logo group flex items-center gap-3">{renderLogo(logo)}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-8">
              {logos.map((logo, i) => (
                <div key={`r-${i}`} className="flex items-center justify-center w-56 h-14 flex-shrink-0 opacity-95">
                  <div className="logo group flex items-center gap-3">{renderLogo(logo)}</div>
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
