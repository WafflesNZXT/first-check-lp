'use client'

import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type TutorialStep = {
  route: string
  selector: string
  title: string
  description: string
  anchorXPercent?: number
  anchorYPercent?: number
  dotOffsetX?: number
  dotOffsetY?: number
  calloutSide?: 'right' | 'left' | 'top' | 'bottom'
}

const STEPS: TutorialStep[] = [
  {
    route: '/dashboard',
    selector: '#audit-input',
    title: 'Enter your URL here',
    description: 'This is where users paste their landing page URL to run an audit.',
    anchorXPercent: 0.52,
    anchorYPercent: 0.2,
    dotOffsetY: 0,
    calloutSide: 'right',
  },
  {
    route: '/dashboard/tutorial-report',
    selector: '#tutorial-report-summary',
    title: 'This is a demo audit report',
    description: 'We use a safe sample report to teach the flow before users touch live data.',
    anchorXPercent: 0.5,
    anchorYPercent: 0.2,
    calloutSide: 'right',
  },
  {
    route: '/dashboard/tutorial-report',
    selector: '#tutorial-report-checklist',
    title: 'Checklist = what to fix first',
    description: 'Each item is actionable and ordered by impact so teams can move quickly.',
    anchorXPercent: 0.7,
    anchorYPercent: 0.12,
    calloutSide: 'right',
  },
  {
    route: '/dashboard/tutorial-report',
    selector: '#tutorial-report-collab',
    title: 'Collaboration tools',
    description: 'Share audits, assign work, and keep progress visible in one place.',
    anchorXPercent: 0.52,
    anchorYPercent: 0.12,
    calloutSide: 'right',
  },
  {
    route: '/dashboard/history',
    selector: '#tutorial-history-root',
    title: 'History page',
    description: 'Users can search and compare completed audits over time.',
    anchorXPercent: 0.18,
    anchorYPercent: 0.12,
    calloutSide: 'right',
  },
  {
    route: '/dashboard/predict',
    selector: '#tutorial-predict-root',
    title: 'Predict page',
    description: 'This page forecasts content performance before shipping updates.',
    anchorXPercent: 0.2,
    anchorYPercent: 0.12,
    calloutSide: 'right',
  },
]

const HIGHLIGHT_CLASSES = ['ring-4', 'ring-blue-500', 'ring-offset-4', 'ring-offset-white', 'dark:ring-offset-slate-950']

type Geometry = {
  dotX: number
  dotY: number
  cardX: number
  cardY: number
  lineLength: number
  lineAngleDeg: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function DashboardTutorial() {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const [cardSize, setCardSize] = useState({ width: 380, height: 210 })
  const highlightedElementRef = useRef<HTMLElement | null>(null)
  const calloutRef = useRef<HTMLDivElement | null>(null)

  const currentStep = STEPS[stepIndex]

  function clearHighlight() {
    const element = highlightedElementRef.current
    if (!element) return
    element.classList.remove(...HIGHLIGHT_CLASSES)
    highlightedElementRef.current = null
  }

  function startTutorial() {
    clearHighlight()
    setStepIndex(0)
    setActive(true)
    const firstStep = STEPS[0]
    if (pathname !== firstStep.route) {
      router.push(firstStep.route)
    }
  }

  function stopTutorial() {
    clearHighlight()
    setGeometry(null)
    setActive(false)
  }

  useEffect(() => {
    const onStart = () => startTutorial()
    window.addEventListener('dashboard:tutorial:start', onStart)
    return () => window.removeEventListener('dashboard:tutorial:start', onStart)
  }, [pathname, router])

  useEffect(() => {
    if (!active) {
      clearHighlight()
      return
    }

    if (!currentStep || pathname !== currentStep.route) {
      setGeometry(null)
      clearHighlight()
      return
    }

    let attempts = 0
    const maxAttempts = 24
    const interval = window.setInterval(() => {
      const element = document.querySelector(currentStep.selector) as HTMLElement | null
      attempts += 1

      if (!element) {
        if (attempts >= maxAttempts) {
          window.clearInterval(interval)
        }
        return
      }

      window.clearInterval(interval)
      clearHighlight()
      highlightedElementRef.current = element
      element.classList.add(...HIGHLIGHT_CLASSES)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 120)

    return () => window.clearInterval(interval)
  }, [active, currentStep, pathname])

  useEffect(() => {
    if (!active) return

    const resizeObserver = new ResizeObserver(() => {
      const rect = calloutRef.current?.getBoundingClientRect()
      if (!rect) return
      setCardSize({ width: rect.width, height: rect.height })
    })

    if (calloutRef.current) {
      resizeObserver.observe(calloutRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [active, stepIndex])

  useEffect(() => {
    if (!active || !highlightedElementRef.current || !currentStep) return

    let rafId = 0

    const updateGeometry = () => {
      const element = highlightedElementRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const margin = 12
      const gap = 26

      const anchorXPercent = currentStep.anchorXPercent ?? 0.5
      const anchorYPercent = currentStep.anchorYPercent ?? 0.5
      const dotX = rect.left + rect.width * anchorXPercent + (currentStep.dotOffsetX ?? 0)
      const dotY = rect.top + rect.height * anchorYPercent + (currentStep.dotOffsetY ?? 0)

      const cardWidth = Math.min(cardSize.width, viewportWidth - margin * 2)
      const cardHeight = Math.min(cardSize.height, viewportHeight - margin * 2)

      let cardX = dotX + gap
      let cardY = dotY - cardHeight / 2
      const preferredSide = currentStep.calloutSide ?? 'right'

      if (preferredSide === 'left') {
        cardX = dotX - cardWidth - gap
      }
      if (preferredSide === 'top') {
        cardX = dotX - cardWidth / 2
        cardY = dotY - cardHeight - gap
      }
      if (preferredSide === 'bottom') {
        cardX = dotX - cardWidth / 2
        cardY = dotY + gap
      }

      cardX = clamp(cardX, margin, viewportWidth - cardWidth - margin)
      cardY = clamp(cardY, margin, viewportHeight - cardHeight - margin)

      const connectionX = clamp(dotX, cardX, cardX + cardWidth)
      const connectionY = clamp(dotY, cardY, cardY + cardHeight)
      const dx = connectionX - dotX
      const dy = connectionY - dotY
      const lineLength = Math.max(Math.hypot(dx, dy) - 8, 0)
      const lineAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI

      setGeometry({
        dotX,
        dotY,
        cardX,
        cardY,
        lineLength,
        lineAngleDeg,
      })

      rafId = window.requestAnimationFrame(updateGeometry)
    }

    rafId = window.requestAnimationFrame(updateGeometry)

    return () => {
      window.cancelAnimationFrame(rafId)
    }
  }, [active, cardSize.height, cardSize.width, currentStep, pathname])

  function goToStep(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= STEPS.length) return
    const nextStep = STEPS[nextIndex]
    setStepIndex(nextIndex)
    if (pathname !== nextStep.route) {
      router.push(nextStep.route)
    }
  }

  function handleNext() {
    if (stepIndex >= STEPS.length - 1) {
      stopTutorial()
      if (pathname !== '/dashboard') {
        router.push('/dashboard')
      }
      return
    }
    goToStep(stepIndex + 1)
  }

  function handleBack() {
    goToStep(stepIndex - 1)
  }

  if (!active || !currentStep) return null

  return (
    <>
      <div className="fixed inset-0 z-[72] pointer-events-none bg-black/20" />

      {geometry && (
        <div
          className="fixed z-[74] pointer-events-none"
          style={{
            left: geometry.dotX - 8,
            top: geometry.dotY - 8,
          }}
        >
          <div className="h-4 w-4 rounded-full bg-blue-500 shadow-[0_0_0_10px_rgba(59,130,246,0.18)] animate-pulse" />
        </div>
      )}

      {geometry && (
        <div
          className="fixed z-[74] pointer-events-none h-[2px] bg-blue-500"
          style={{
            left: geometry.dotX,
            top: geometry.dotY,
            width: geometry.lineLength,
            transform: `rotate(${geometry.lineAngleDeg}deg)`,
            transformOrigin: 'left center',
          }}
        />
      )}

      <div
        ref={calloutRef}
        className="fixed z-[75] w-[min(92vw,420px)] rounded-2xl border border-blue-200 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        style={{
          left: geometry ? geometry.cardX : 16,
          top: geometry ? geometry.cardY : 16,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
              <Sparkles className="w-3.5 h-3.5" /> Tutorial mode
            </p>
            <h3 className="mt-1 text-base font-black tracking-tight text-black">{currentStep.title}</h3>
          </div>
          <button
            type="button"
            onClick={stopTutorial}
            className="rounded-full border border-black/10 p-1.5 text-gray-500 hover:text-black hover:bg-gray-50"
            aria-label="Close tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-600">{currentStep.description}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-gray-500">Step {stepIndex + 1} of {STEPS.length}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-blue-700"
            >
              {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
