'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Prism from 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'

type PredictResponse = {
  predicted_seo_score: number
  predicted_readability_score: number
  predicted_score: number
  current_score: number
  summary: string
  red_flags: string[]
}

type PredictFileTab = {
  id: string
  name: string
  content: string
  result: PredictResponse | null
  error: string | null
}

type SearchMatch = {
  start: number
  end: number
  line: number
}

const PREDICT_TAB_STORAGE_KEY = 'audo_predict_tabs_v1'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function detectLanguage(content: string) {
  const source = content.trim()
  if (!source) return { id: 'plain', label: 'Plain Text' }

  if (/^\s*\{[\s\S]*\}\s*$/.test(source) || /^\s*\[[\s\S]*\]\s*$/.test(source)) {
    return { id: 'json', label: 'JSON' }
  }
  if (/<\/?[a-z][\s\S]*>/i.test(source)) {
    return { id: 'html', label: 'HTML' }
  }
  if (/^\s*\.?[a-z0-9\-\_]+\s*\{[\s\S]*\}/im.test(source) || /(--[a-z\-]+\s*:)/i.test(source)) {
    return { id: 'css', label: 'CSS' }
  }
  if (/\b(def|import|from|class|print|lambda|None|True|False)\b/.test(source)) {
    return { id: 'python', label: 'Python' }
  }
  if (/\b(function|const|let|var|return|=>|import|export|await|async|interface|type)\b/.test(source)) {
    return { id: 'javascript', label: 'JavaScript / TypeScript' }
  }
  if (/\b(SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(source)) {
    return { id: 'sql', label: 'SQL' }
  }

  return { id: 'plain', label: 'Plain Text' }
}

function toPrismLanguage(languageId: string) {
  if (languageId === 'html') return 'markup'
  if (languageId === 'javascript') return 'typescript'
  return languageId
}

function highlightCode(content: string, languageId: string) {
  const source = String(content || '')
  if (!source) return '&nbsp;'

  const prismLanguage = toPrismLanguage(languageId)
  const grammar = Prism.languages[prismLanguage]

  if (!grammar) {
    return escapeHtml(source)
  }

  return Prism.highlight(source, grammar, prismLanguage)
}

function ScoreGauge({ label, score, tone }: { label: string, score: number, tone: 'dark' | 'violet' }) {
  const progress = Math.max(0, Math.min(100, Math.round(score || 0)))
  const barTone = tone === 'dark' ? 'bg-black dark:bg-white' : 'bg-violet-600 dark:bg-violet-300'

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
      <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl sm:text-4xl font-black text-black dark:text-white tabular-nums">{progress}</p>
      <div className="mt-3 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full ${barTone}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function PredictPage() {
  const [loading, setLoading] = useState(false)
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [tabs, setTabs] = useState<PredictFileTab[]>([
    { id: crypto.randomUUID(), name: 'File 1', content: '', result: null, error: null },
  ])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [showFind, setShowFind] = useState(false)
  const [findQuery, setFindQuery] = useState('')
  const [activeMatchIndex, setActiveMatchIndex] = useState(0)
  const [showJumpToLine, setShowJumpToLine] = useState(false)
  const [jumpToLineInput, setJumpToLineInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const highlightRef = useRef<HTMLPreElement | null>(null)
  const lineNumbersRef = useRef<HTMLPreElement | null>(null)

  const activeTab = useMemo(() => {
    if (tabs.length === 0) return null
    return tabs.find((tab) => tab.id === activeTabId) || tabs[0]
  }, [tabs, activeTabId])

  const activeLanguage = useMemo(() => detectLanguage(activeTab?.content || ''), [activeTab?.content])
  const activeHighlighted = useMemo(
    () => highlightCode(activeTab?.content || '', activeLanguage.id),
    [activeTab?.content, activeLanguage.id]
  )

  const lineNumbers = useMemo(() => {
    const lineCount = Math.max(1, String(activeTab?.content || '').split('\n').length)
    return Array.from({ length: lineCount }, (_, index) => String(index + 1)).join('\n')
  }, [activeTab?.content])

  const searchMatches = useMemo<SearchMatch[]>(() => {
    const source = String(activeTab?.content || '')
    const query = findQuery.trim()
    if (!source || !query) return []

    const sourceLower = source.toLowerCase()
    const queryLower = query.toLowerCase()
    const nextMatches: SearchMatch[] = []

    let startIndex = 0
    while (startIndex <= sourceLower.length) {
      const foundIndex = sourceLower.indexOf(queryLower, startIndex)
      if (foundIndex < 0) break

      const line = source.slice(0, foundIndex).split('\n').length
      nextMatches.push({ start: foundIndex, end: foundIndex + query.length, line })

      startIndex = foundIndex + Math.max(query.length, 1)
    }

    return nextMatches
  }, [activeTab?.content, findQuery])

  useEffect(() => {
    if (activeMatchIndex >= searchMatches.length) {
      setActiveMatchIndex(0)
    }
  }, [searchMatches.length, activeMatchIndex])

  useEffect(() => {
    if (!activeTabId && tabs.length > 0) {
      setActiveTabId(tabs[0].id)
    }
  }, [tabs, activeTabId])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const navType = navEntries?.[0]?.type
    if (navType === 'reload') {
      window.sessionStorage.removeItem(PREDICT_TAB_STORAGE_KEY)
    }

    const stored = window.sessionStorage.getItem(PREDICT_TAB_STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as { tabs?: PredictFileTab[]; activeTabId?: string }
      if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        setTabs(parsed.tabs.map((tab, index) => ({
          id: String(tab.id || crypto.randomUUID()),
          name: String(tab.name || `File ${index + 1}`),
          content: String(tab.content || ''),
          result: tab.result || null,
          error: tab.error || null,
        })))
        setActiveTabId(String(parsed.activeTabId || parsed.tabs[0].id || ''))
      }
    } catch {
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (tabs.length === 0) return

    window.sessionStorage.setItem(
      PREDICT_TAB_STORAGE_KEY,
      JSON.stringify({ tabs, activeTabId: activeTabId || tabs[0].id })
    )
  }, [tabs, activeTabId])

  const syncEditorScroll = () => {
    if (!textareaRef.current || !highlightRef.current) return
    highlightRef.current.scrollTop = textareaRef.current.scrollTop
    highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const focusSearchMatch = (targetIndex: number, smooth = false) => {
    if (!textareaRef.current || searchMatches.length === 0) return

    const boundedIndex = ((targetIndex % searchMatches.length) + searchMatches.length) % searchMatches.length
    const match = searchMatches[boundedIndex]

    textareaRef.current.focus()
    textareaRef.current.setSelectionRange(match.start, match.end)

    const lineHeight = 13 * 1.55
    const targetTop = Math.max(0, (match.line - 1) * lineHeight - lineHeight * 2)
    if (smooth) {
      textareaRef.current.scrollTo({ top: targetTop, behavior: 'smooth' })
    } else {
      textareaRef.current.scrollTop = targetTop
    }

    setActiveMatchIndex(boundedIndex)
    syncEditorScroll()
  }

  const focusNextMatch = () => {
    focusSearchMatch(activeMatchIndex + 1, true)
  }

  const focusPreviousMatch = () => {
    focusSearchMatch(activeMatchIndex - 1, true)
  }

  const jumpToLine = () => {
    if (!textareaRef.current || !activeTab) return

    const lines = String(activeTab.content || '').split('\n')
    const maxLine = Math.max(1, lines.length)
    const requested = Number.parseInt(jumpToLineInput, 10)
    const targetLine = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), maxLine) : 1

    let cursorIndex = 0
    for (let lineIndex = 1; lineIndex < targetLine; lineIndex += 1) {
      cursorIndex += lines[lineIndex - 1].length + 1
    }

    textareaRef.current.focus()
    textareaRef.current.setSelectionRange(cursorIndex, cursorIndex)

    const lineHeight = 13 * 1.55
    textareaRef.current.scrollTop = (targetLine - 1) * lineHeight
    syncEditorScroll()
  }

  const scrollEditorToTop = () => {
    if (!textareaRef.current) return
    textareaRef.current.selectionStart = 0
    textareaRef.current.selectionEnd = 0
    textareaRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    highlightRef.current?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
    lineNumbersRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateActiveTab = (patch: Partial<PredictFileTab>) => {
    if (!activeTab) return
    setTabs((previousTabs) =>
      previousTabs.map((tab) => (tab.id === activeTab.id ? { ...tab, ...patch } : tab))
    )
  }

  const addTab = () => {
    const nextTab: PredictFileTab = {
      id: crypto.randomUUID(),
      name: `File ${tabs.length + 1}`,
      content: '',
      result: null,
      error: null,
    }
    setTabs((previousTabs) => [...previousTabs, nextTab])
    setActiveTabId(nextTab.id)
  }

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return

    const tabIndex = tabs.findIndex((tab) => tab.id === tabId)
    const nextTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(nextTabs)

    if (activeTabId === tabId) {
      const fallbackTab = nextTabs[Math.max(0, tabIndex - 1)] || nextTabs[0]
      setActiveTabId(fallbackTab.id)
    }
  }

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      try {
        const userRes = await supabase.auth.getUser()
        const user = userRes.data.user
        if (!user) {
          if (mounted) setIsPro(false)
          return
        }

        const { data } = await supabase.from('profiles').select('plan_type').eq('id', user.id).maybeSingle()
        const plan = data?.plan_type
        if (mounted) setIsPro(plan === 'pro' || plan === 'admin')
      } catch (err) {
        if (mounted) setIsPro(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [])

  const runPrediction = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeTab || !activeTab.content.trim() || loading) return

    setLoading(true)
    updateActiveTab({ error: null })

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: activeTab.content }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(String(payload?.error || 'Prediction failed'))
      }

      updateActiveTab({ result: payload as PredictResponse, error: null })
    } catch (err: unknown) {
      updateActiveTab({ error: err instanceof Error ? err.message : 'Prediction failed', result: null })
    } finally {
      setLoading(false)
    }
  }

  const locked = isPro === false

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <div id="tutorial-predict-root" className="max-w-5xl mx-auto space-y-6 sm:space-y-8 relative">
        {locked && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto">
            <div className="bg-white/90 dark:bg-slate-900/85 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 text-center shadow-lg max-w-sm w-full">
              <h3 className="text-lg font-black text-black dark:text-white mb-2">Upgrade to Pro</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Predict is a Pro feature. Upgrade to unlock content forecasting and fine-grained model insights.</p>
              <a href="/pricing" className="inline-block bg-black dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-2xl font-black">Unlock Predict</a>
            </div>
          </div>
        )}

        <header className="space-y-2">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">SEO Forecast</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black dark:text-white">Predict Content Performance</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300">Paste code or copy, run prediction per file tab, and compare model notes without losing previous drafts.</p>
        </header>

        <div className={`rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm space-y-3 ${locked ? 'pointer-events-none opacity-60' : ''}`}>
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const tabIsActive = tab.id === activeTab?.id
              return (
                <div key={tab.id} className={`inline-flex items-center rounded-xl border px-2.5 py-1.5 text-xs font-bold ${tabIsActive ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-slate-900' : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-950'}`}>
                  <button
                    type="button"
                    onClick={() => setActiveTabId(tab.id)}
                    className="max-w-[160px] truncate"
                    title={tab.name}
                  >
                    {tab.name}
                  </button>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => closeTab(tab.id)}
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${tabIsActive ? 'bg-white/20 dark:bg-slate-900/20' : 'bg-gray-100 dark:bg-slate-800'}`}
                      aria-label={`Close ${tab.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}

            <button
              type="button"
              onClick={addTab}
              className="rounded-xl border border-gray-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-black uppercase tracking-wider text-black dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              + New File
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <input
              value={activeTab?.name || ''}
              onChange={(event) => updateActiveTab({ name: event.target.value || 'Untitled' })}
              className="w-full sm:max-w-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs sm:text-sm text-black dark:text-white"
              placeholder="File name"
            />
            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-gray-700 dark:text-gray-200">
              {activeLanguage.label}
            </span>
          </div>
        </div>

        <form onSubmit={runPrediction} className="space-y-4">
          <div className={`relative rounded-2xl border border-gray-200 dark:border-slate-700 bg-[#0b1020] text-white overflow-hidden ${locked ? 'pointer-events-none opacity-60' : ''}`}>
            <style>{`
              .code-editor,
              .code-overlay {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                font-size: 13px;
                line-height: 1.55;
              }
              .code-lines {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                font-size: 13px;
                line-height: 1.55;
              }
              .code-overlay .token.comment,
              .code-overlay .token.prolog,
              .code-overlay .token.doctype,
              .code-overlay .token.cdata { color: #94a3b8; }
              .code-overlay .token.punctuation { color: #cbd5e1; }
              .code-overlay .token.property,
              .code-overlay .token.tag,
              .code-overlay .token.boolean,
              .code-overlay .token.number,
              .code-overlay .token.constant,
              .code-overlay .token.symbol,
              .code-overlay .token.deleted { color: #fca5a5; }
              .code-overlay .token.selector,
              .code-overlay .token.attr-name,
              .code-overlay .token.string,
              .code-overlay .token.char,
              .code-overlay .token.builtin,
              .code-overlay .token.inserted { color: #86efac; }
              .code-overlay .token.operator,
              .code-overlay .token.entity,
              .code-overlay .token.url,
              .code-overlay .language-css .token.string,
              .code-overlay .style .token.string,
              .code-overlay .token.variable { color: #fcd34d; }
              .code-overlay .token.atrule,
              .code-overlay .token.attr-value,
              .code-overlay .token.function,
              .code-overlay .token.class-name { color: #93c5fd; }
              .code-overlay .token.keyword { color: #c4b5fd; }
              .code-overlay .token.regex,
              .code-overlay .token.important { color: #f9a8d4; }
            `}</style>

            <div className="border-b border-white/10 px-4 py-2 text-[10px] uppercase tracking-widest font-black text-blue-200">
              <div className="flex items-center justify-between gap-3">
                <span>Predict Editor</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFind((previousValue) => !previousValue)}
                    className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-100 hover:bg-white/10"
                  >
                    Find
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJumpToLine((previousValue) => !previousValue)}
                    className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-100 hover:bg-white/10"
                  >
                    Jump to line
                  </button>
                </div>
              </div>
            </div>

            {showFind && (
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2">
                <input
                  value={findQuery}
                  onChange={(event) => {
                    setFindQuery(event.target.value)
                    setActiveMatchIndex(0)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && event.shiftKey) {
                      event.preventDefault()
                      focusPreviousMatch()
                      return
                    }
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      focusNextMatch()
                    }
                  }}
                  placeholder="Find in file"
                  className="w-44 sm:w-56 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-gray-400 outline-none"
                />

                <button
                  type="button"
                  onClick={focusPreviousMatch}
                  disabled={searchMatches.length === 0}
                  className="rounded-lg border border-white/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Prev
                </button>

                <button
                  type="button"
                  onClick={focusNextMatch}
                  disabled={searchMatches.length === 0}
                  className="rounded-lg border border-white/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Next
                </button>

                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">
                  {searchMatches.length > 0 ? `${activeMatchIndex + 1}/${searchMatches.length}` : '0/0'}
                </span>
              </div>
            )}

            {showJumpToLine && (
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
                <input
                  value={jumpToLineInput}
                  onChange={(event) => setJumpToLineInput(event.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      jumpToLine()
                    }
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Line #"
                  className="w-24 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-gray-400 outline-none"
                />
                <button
                  type="button"
                  onClick={jumpToLine}
                  className="rounded-lg border border-white/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10"
                >
                  Go
                </button>
              </div>
            )}

            <div className="relative h-[320px] sm:h-[420px] flex">
              <pre
                ref={lineNumbersRef}
                aria-hidden="true"
                className="code-lines m-0 w-12 shrink-0 overflow-hidden border-r border-white/10 bg-[#0a0f1d] px-2 py-4 text-right text-gray-500 select-none"
              >
                {lineNumbers}
              </pre>

              <div className="relative min-w-0 flex-1">
                <pre
                  ref={highlightRef}
                  aria-hidden="true"
                  className="code-overlay absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-words p-4 text-sm text-white pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: activeHighlighted || '&nbsp;' }}
                />

                <textarea
                  ref={textareaRef}
                  value={activeTab?.content || ''}
                  onChange={(event) => updateActiveTab({ content: event.target.value })}
                  onScroll={syncEditorScroll}
                  spellCheck={false}
                  placeholder="Paste code or content here..."
                  className="code-editor absolute inset-0 w-full h-full resize-none bg-transparent p-4 text-sm text-transparent [text-shadow:0_0_0_#e2e8f0] caret-white placeholder:text-gray-500 outline-none"
                />

                <button
                  type="button"
                  onClick={scrollEditorToTop}
                  className="absolute right-3 bottom-3 rounded-full border border-white/20 bg-[#0b1020]/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-100 hover:bg-[#121a32]"
                >
                  Back to top
                </button>
              </div>
            </div>
          </div>

          <div className={`flex justify-end`}>
            <button
              type="submit"
              disabled={loading || !(activeTab?.content || '').trim() || locked}
              className="rounded-2xl bg-black dark:bg-white text-white dark:text-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-60"
            >
              {loading ? 'Predicting...' : 'Run Prediction'}
            </button>
          </div>
        </form>

        {activeTab?.error && (
          <p className="text-sm text-red-500">{activeTab.error}</p>
        )}

        {activeTab?.result && (
          <section className={`space-y-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <ScoreGauge label="Predicted Score" score={activeTab.result.predicted_score} tone="dark" />
              <ScoreGauge label="Current Score" score={activeTab.result.current_score} tone="violet" />
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-3">
              <h2 className="text-lg font-black text-black dark:text-white tracking-tight">Model Notes</h2>
              <p className="text-sm text-gray-700 dark:text-gray-200">{activeTab.result.summary}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  SEO: {activeTab.result.predicted_seo_score}
                </span>
                <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                  Readability: {activeTab.result.predicted_readability_score}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-3">
              <h3 className="text-base font-black text-black dark:text-white tracking-tight">Red Flags</h3>
              {activeTab.result.red_flags.length > 0 ? (
                <ul className="space-y-2">
                  {activeTab.result.red_flags.map((flag, index) => (
                    <li key={`${flag}-${index}`} className="text-sm text-gray-700 dark:text-gray-200">• {flag}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-300">No major red flags detected.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
