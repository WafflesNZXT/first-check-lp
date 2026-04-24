'use client';

import { ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type VoteValue = 'up' | 'down';

const IDEA_KEY = 'repo-agent-dashboard-edits';
const IDEA_TITLE = 'Should we build repo/code-file connection so an AI agent can apply changes directly in your dashboard?';
const LOCAL_VOTE_KEY = `firstcheck_vote_${IDEA_KEY}`;
const LOCAL_CLIENT_ID_KEY = 'firstcheck_idea_client_id';

function getClientId() {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(LOCAL_CLIENT_ID_KEY);
  if (existing) return existing;

  const created = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(LOCAL_CLIENT_ID_KEY, created);
  return created;
}

export default function HomeIdeaValidationBar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);

  const hasVoted = useMemo(() => Boolean(selectedVote), [selectedVote]);

  useEffect(() => {
    const savedVote = window.localStorage.getItem(LOCAL_VOTE_KEY);
    if (savedVote === 'up' || savedVote === 'down') {
      setSelectedVote(savedVote);
      setMessage('Thanks — your vote is saved.');
    }
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [modalOpen]);

  async function submitVote(vote: VoteValue) {
    if (submitting || hasVoted) return;

    try {
      setSubmitting(true);
      setMessage('');

      const response = await fetch('/api/idea-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaKey: IDEA_KEY,
          vote,
          clientId: getClientId(),
          context: 'homepage_bar',
        }),
      });

      if (!response.ok) {
        throw new Error('Vote request failed');
      }

      window.localStorage.setItem(LOCAL_VOTE_KEY, vote);
      setSelectedVote(vote);
      setMessage('Thanks for the feedback.');
    } catch {
      setMessage('Could not save your vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 md:px-6 mt-4 md:mt-6">
        <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 md:px-5 md:py-3.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] font-black text-blue-100">Feature validation</p>
            <p className="text-sm md:text-[15px] text-white font-semibold truncate">{IDEA_TITLE}</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-1 text-xs font-bold text-blue-200 hover:text-white underline underline-offset-2"
            >
              Read more
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submitVote('up')}
              disabled={submitting || hasVoted}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors ${
                selectedVote === 'up'
                  ? 'border-emerald-300 bg-emerald-500/20 text-emerald-100'
                  : 'border-white/30 bg-white/5 text-white hover:bg-white/15 disabled:hover:bg-white/5'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-label="Upvote feature idea"
            >
              <ThumbsUp className="w-3.5 h-3.5" /> Upvote
            </button>
            <button
              type="button"
              onClick={() => submitVote('down')}
              disabled={submitting || hasVoted}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors ${
                selectedVote === 'down'
                  ? 'border-red-300 bg-red-500/20 text-red-100'
                  : 'border-white/30 bg-white/5 text-white hover:bg-white/15 disabled:hover:bg-white/5'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
              aria-label="Downvote feature idea"
            >
              <ThumbsDown className="w-3.5 h-3.5" /> Downvote
            </button>
          </div>
        </div>
        {message && <p className="mt-2 px-1 text-xs text-blue-100">{message}</p>}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm px-4 py-6 md:p-8" role="dialog" aria-modal="true" aria-label="Feature idea details">
          <div className="h-full w-full max-w-2xl mx-auto flex items-center justify-center">
            <div className="w-full rounded-3xl border border-black/10 bg-white shadow-[0_35px_120px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4 md:px-6">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] font-black text-blue-700">Feature validation</p>
                  <h3 className="mt-1 text-xl md:text-2xl font-black text-black">Connect repo and let AI ship fixes in-dashboard</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-black/10 p-2 text-gray-500 hover:text-black hover:bg-gray-50"
                  aria-label="Close feature details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-5 md:px-6 md:py-6 space-y-4 text-sm text-gray-700">
                <p>
                  We&apos;re exploring a workflow where you connect your repository or upload code files,
                  then an AI agent proposes and applies landing-page fixes directly from the dashboard.
                </p>
                <p>
                  The goal is to move from &ldquo;issue found&rdquo; to &ldquo;fix shipped&rdquo; in one place with review controls,
                  so founders can approve changes quickly without context switching.
                </p>
                <p>
                  Your vote helps us decide whether to prioritize this in the roadmap now.
                </p>
              </div>

              <div className="border-t border-black/10 px-5 py-4 md:px-6 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
