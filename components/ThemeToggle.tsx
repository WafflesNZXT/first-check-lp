'use client'

type Theme = 'light' | 'dark'

export default function ThemeToggle({ theme, onToggle }: { theme: Theme, onToggle: () => void }) {

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-black dark:text-slate-100 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2" />
          <path d="M12 21v2" />
          <path d="M4.22 4.22l1.42 1.42" />
          <path d="M18.36 18.36l1.42 1.42" />
          <path d="M1 12h2" />
          <path d="M21 12h2" />
          <path d="M4.22 19.78l1.42-1.42" />
          <path d="M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3a6.75 6.75 0 1 0 9 9A8.25 8.25 0 1 1 12 3Z" />
        </svg>
      )}
    </button>
  )
}
