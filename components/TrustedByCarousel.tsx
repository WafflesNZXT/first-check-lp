'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'

export default function TrustedByCarousel() {
  const logos = [
    { key: 'ontology', label: 'Ontology' },
    { key: 'dobda', label: 'Dobda' },
    { key: 'inobex', label: 'Inobex' },
  ]
  const marqueeLogos = [...logos, ...logos, ...logos]
  const trackRef = useRef<HTMLDivElement | null>(null)
  const groupRef = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)
  const groupWidthRef = useRef(0)
  const lastTimestampRef = useRef<number | null>(null)
  const speedRef = useRef(42)
  const targetSpeedRef = useRef(42)

  useEffect(() => {
    const measureGroup = () => {
      groupWidthRef.current = groupRef.current?.getBoundingClientRect().width ?? 0
    }

    measureGroup()

    const resizeObserver = new ResizeObserver(() => {
      measureGroup()
    })

    if (groupRef.current) {
      resizeObserver.observe(groupRef.current)
    }

    let rafId = 0

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
      }

      const deltaSeconds = (timestamp - lastTimestampRef.current) / 1000
      lastTimestampRef.current = timestamp

      speedRef.current += (targetSpeedRef.current - speedRef.current) * Math.min(1, deltaSeconds * 8)

      const width = groupWidthRef.current
      if (width > 0 && trackRef.current) {
        offsetRef.current = (offsetRef.current + speedRef.current * deltaSeconds) % width
        trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`
      }

      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
    }
  }, [])

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
        .fc-marquee-track {
          display: flex;
          width: max-content;
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

        .fc-marquee-track .logo img, .fc-marquee-track .logo svg { height: 34px; width: auto; }

        .fc-marquee-track .logo { transition: none; }

        .fc-marquee-mask {
          mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
        }
      `}</style>

      <p className="text-xs font-black uppercase tracking-widest text-gray-700 mb-3 px-4 md:px-6">Trusted by</p>

      <div
        className="relative fc-marquee-wrap overflow-hidden bg-transparent"
        onMouseEnter={() => {
          targetSpeedRef.current = 18
        }}
        onMouseLeave={() => {
          targetSpeedRef.current = 42
        }}
      >
        <div className="w-full overflow-hidden fc-marquee-mask">
          <div ref={trackRef} className="fc-marquee-track">
            <div ref={groupRef} className="fc-marquee-group">
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
