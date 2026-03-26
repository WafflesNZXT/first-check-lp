'use client'

import { useState } from 'react'
import { X } from 'lucide-react' // or use a standard 'x' character

export default function FeedbackModal({ userEmail, isOpen, onClose }: { userEmail: string, isOpen: boolean, onClose: () => void }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!message.trim()) return
    setSending(true)
    
    await fetch('/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ message, userEmail })
    })

    setSending(false)
    setMessage('')
    onClose()
    alert("Thanks! Your feedback was sent directly to the founder.")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tighter text-black">Give Feedback</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>

        <textarea
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What can we improve? Be ruthless."
          className="w-full h-32 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black resize-none text-black placeholder:text-gray-400 mb-6"
        />

        <button
          onClick={handleSubmit}
          disabled={sending || !message.trim()}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {sending ? 'Sending...' : 'Send Feedback'}
        </button>
      </div>
    </div>
  )
}