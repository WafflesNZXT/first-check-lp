'use client'

import React from 'react'
import Image from 'next/image'

export default function TrustedByCarousel() {
  const logos = [
    { key: 'ontology', label: 'Ontology' },
    { key: 'dobda', label: 'Dobda' },
    { key: 'inobex', label: 'Inobex' },
  ]
  const marqueeLogos = [...logos, ...logos, ...logos]

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
            <Image src="/inobex-logo.svg" alt="Inobex" width={48} height={40} className="w-12 h-10 object-contain" />
          </div>
          <div className="text-sm font-bold tracking-wider text-[#0b3b7a]">{logo.label}</div>
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
        @keyframes fc-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .fc-marquee-track {
          display: flex;
          width: max-content;
          animation: fc-marquee 36s linear infinite;
          will-change: transform;
        }

        .fc-marquee-group {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex-shrink: 0;
          min-width: max-content;
          padding-right: 2rem;
        }

        .fc-marquee-wrap:hover .fc-marquee-track { animation-play-state: paused; }

        .fc-marquee-track .logo > * { filter: none; transition: filter 220ms ease, transform 220ms ease; }
        .fc-marquee-wrap:hover .logo:not(:hover) > * { filter: grayscale(100%) brightness(0.6); }

        .fc-marquee-track .logo img, .fc-marquee-track .logo svg { height: 34px; width: auto; }

        .fc-marquee-track .logo { cursor: pointer; transition: transform 220ms ease; }
        .fc-marquee-track .logo:hover { transform: translateY(-3px) scale(1.02); z-index: 10; }

        .fc-marquee-mask {
          mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
        }
      `}</style>

      <p className="text-xs font-black uppercase tracking-widest text-gray-700 mb-3 px-4 md:px-6">Trusted by</p>

      <div className="relative fc-marquee-wrap overflow-hidden bg-transparent">
        <div className="w-full overflow-hidden fc-marquee-mask">
          <div className="fc-marquee-track">
            <div className="fc-marquee-group">
              {marqueeLogos.map((logo, i) => (
                <div key={`a-${logo.key}-${i}`} className="flex items-center justify-center w-56 h-14 flex-shrink-0 opacity-95">
                  <div className="logo flex items-center gap-3">{renderLogo(logo)}</div>
                </div>
              ))}
            </div>

            <div className="fc-marquee-group" aria-hidden>
              {marqueeLogos.map((logo, i) => (
                <div key={`b-${logo.key}-${i}`} className="flex items-center justify-center w-56 h-14 flex-shrink-0 opacity-95">
                  <div className="logo flex items-center gap-3">{renderLogo(logo)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
