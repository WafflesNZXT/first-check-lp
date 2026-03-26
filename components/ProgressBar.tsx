'use client'

export default function ProgressBar({ status }: { status: string }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          {status === 'completed' ? 'audit finished' : 'analyzing site content...'}
        </span>
        <span className="text-xs font-bold text-black">{status === 'completed' ? '100%' : ''}</span>
      </div>

      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
        {status === 'processing' ? (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-[-40%] w-2/3 h-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-90" style={{ animation: 'move 1.2s linear infinite' }} />
          </div>
        ) : (
          <div className="h-full bg-black transition-all duration-500 ease-out" style={{ width: status === 'completed' ? '100%' : '0%' }} />
        )}
      </div>

      <style>{`@keyframes move { 0% { transform: translateX(0%); } 100% { transform: translateX(150%); } }`}</style>
    </div>
  )
}