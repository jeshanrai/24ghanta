'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/Image/SafeImage';
import type { Poll as PollType } from '@/lib/data/polls';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const VOTED_KEY = (pollId: string) => `voted_poll_${pollId}`;

interface PollProps {
  /** One or more polls. When multiple, prev/next arrows appear. */
  polls?: PollType[];
  /** Legacy single-poll prop. Internally converted to a 1-element list. */
  poll?: PollType;
  compact?: boolean;
}

export function Poll({ polls: propPolls, poll: legacyPoll, compact = false }: PollProps) {
  // Server is the source of truth for both the poll list and per-visitor vote
  // state. localStorage is just a fallback so navigation between pages doesn't
  // briefly show "you can vote" before the API returns userVotedOptionId.
  const initialPolls: PollType[] = useMemo(() => {
    if (propPolls && propPolls.length > 0) return propPolls;
    if (legacyPoll) return [legacyPoll];
    return [];
  }, [propPolls, legacyPoll]);

  const [polls, setPolls] = useState<PollType[]>(initialPolls);
  const [loading, setLoading] = useState(initialPolls.length === 0);
  const [index, setIndex] = useState(0);

  // Per-poll selection + reveal state. Keyed by poll id so we can navigate
  // forward/back without losing the user's "just voted" flash.
  const [selectedByPoll, setSelectedByPoll] = useState<Record<string, string>>({});
  const [revealedByPoll, setRevealedByPoll] = useState<Record<string, boolean>>({});

  /* ── initial fetch when no SSR data was provided ─────────────────── */
  useEffect(() => {
    if (initialPolls.length > 0) {
      setPolls(initialPolls);
      setLoading(false);
      return;
    }
    fetch(`${API}/api/polls/active`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.data)) setPolls(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialPolls]);

  /* ── seed selection state from server-reported vote + localStorage ── */
  useEffect(() => {
    if (polls.length === 0) return;
    const nextSelected: Record<string, string> = {};
    const nextRevealed: Record<string, boolean> = {};
    for (const p of polls) {
      // Server source of truth wins; fall back to localStorage for the
      // brief window between client mount and API hydration.
      const serverVote = p.userVotedOptionId ?? null;
      const localVote = typeof window !== 'undefined' ? localStorage.getItem(VOTED_KEY(p.id)) : null;
      const chosen = serverVote || localVote;
      if (chosen) {
        nextSelected[p.id] = chosen;
        nextRevealed[p.id] = true;
      }
    }
    setSelectedByPoll(nextSelected);
    setRevealedByPoll(nextRevealed);
  }, [polls]);

  /* ── auto-advance: after a vote, jump to next un-voted poll ──────── */
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  function scheduleAdvance() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      setIndex((current) => {
        // Find the next un-voted poll, wrapping around.
        for (let step = 1; step <= polls.length; step++) {
          const candidate = (current + step) % polls.length;
          const id = polls[candidate]?.id;
          if (id && !selectedByPoll[id]) return candidate;
        }
        // All voted — just step forward so the user can browse results.
        return (current + 1) % Math.max(polls.length, 1);
      });
    }, 1200);
  }

  /* ── vote handler ─────────────────────────────────────────────────── */
  async function handleVote(pollId: string, optionId: string) {
    if (selectedByPoll[pollId]) return; // already voted

    // Optimistic UI.
    setSelectedByPoll((prev) => ({ ...prev, [pollId]: optionId }));
    setPolls((prev) =>
      prev.map((p) =>
        p.id !== pollId
          ? p
          : {
              ...p,
              totalVotes: p.totalVotes + 1,
              options: p.options.map((o) =>
                o.id === optionId ? { ...o, votes: o.votes + 1 } : o
              ),
            }
      )
    );
    setTimeout(() => setRevealedByPoll((prev) => ({ ...prev, [pollId]: true })), 80);
    if (typeof window !== 'undefined') localStorage.setItem(VOTED_KEY(pollId), optionId);

    try {
      const res = await fetch(`${API}/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: parseInt(optionId, 10) }),
      });
      // Server-side dedupe: 409 means another tab / earlier session already
      // voted with this IP+UA. Honour the previous choice so counts stay
      // consistent — don't fight the server.
      if (res.status === 409) {
        const body = await res.json().catch(() => null);
        const previous = body?.previousOptionId as string | null | undefined;
        if (previous && previous !== optionId) {
          // Roll back the optimistic bump and snap to the real choice.
          setSelectedByPoll((prev) => ({ ...prev, [pollId]: previous }));
          setPolls((prev) =>
            prev.map((p) =>
              p.id !== pollId
                ? p
                : {
                    ...p,
                    totalVotes: p.totalVotes - 1,
                    options: p.options.map((o) =>
                      o.id === optionId ? { ...o, votes: Math.max(0, o.votes - 1) } : o
                    ),
                  }
            )
          );
          if (typeof window !== 'undefined') localStorage.setItem(VOTED_KEY(pollId), previous);
        }
      }
    } catch {
      // Network failure — keep optimistic state; next page load will reconcile.
    }

    scheduleAdvance();
  }

  /* ── render ──────────────────────────────────────────────────────── */
  if (loading || polls.length === 0) return null;

  const safeIndex = Math.min(index, polls.length - 1);
  const poll = polls[safeIndex];
  const hasVoted = !!selectedByPoll[poll.id];
  const showResults = !!revealedByPoll[poll.id];
  const selectedOption = selectedByPoll[poll.id] ?? null;

  const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
  const pct = (votes: number) => (totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100));
  const formatVotes = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  const hasMultiple = polls.length > 1;

  function goPrev() {
    setIndex((i) => (i - 1 + polls.length) % polls.length);
  }
  function goNext() {
    setIndex((i) => (i + 1) % polls.length);
  }

  return (
    <div className="relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl md:text-2xl font-headline font-extrabold uppercase tracking-tight text-[var(--color-text-primary)]">
            Quick Poll
          </span>
          {hasMultiple && (
            <span className="text-[10px] md:text-xs font-medium text-[var(--color-text-muted)] tabular-nums">
              {safeIndex + 1} / {polls.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasVoted && (
            <span className="text-[10px] md:text-xs font-bold text-[#16a34a] bg-[#16a34a]/10 px-3 py-1 rounded-full animate-fade-in border border-[#16a34a]/20 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Voted
            </span>
          )}
          {hasMultiple && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous poll"
                title="Previous poll"
                className="p-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next poll"
                title="Next poll"
                className="p-1.5 rounded-full border border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        className={`mt-4 ${
          poll.imageUrl ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr] gap-6' : ''
        }`}
        // key forces a clean remount + animation when the slider moves
        key={poll.id}
      >
        {poll.imageUrl && (
          <div className="relative overflow-hidden rounded-xl w-full aspect-[16/10] sm:aspect-video md:aspect-auto md:h-full group/image shadow-md min-h-[200px] sm:min-h-[250px] md:min-h-0">
            <SafeImage
              src={poll.imageUrl}
              alt={poll.question}
              fill
              className="object-cover transition-all duration-1000 group-hover/image:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        <div className={`flex flex-col justify-start ${poll.imageUrl ? 'max-h-[500px]' : ''}`}>
          <h3
            className={`font-headline text-[var(--color-text-primary)] tracking-tight ${
              compact ? 'text-base md:text-lg mb-4 leading-snug' : 'text-lg md:text-2xl mb-5'
            }`}
          >
            {poll.question}
          </h3>

          <div className={`space-y-3 ${poll.imageUrl ? 'overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            {poll.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const percentage = pct(option.votes);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleVote(poll.id, option.id)}
                  disabled={hasVoted}
                  className={`w-full text-left relative overflow-hidden rounded-lg transition-all duration-300 ${
                    hasVoted ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-between ${
                      compact ? 'px-4 py-3' : 'px-5 py-4'
                    } border rounded-lg transition-all duration-500 ${
                      isSelected && showResults
                        ? 'border-[#c41d2f] bg-[#c41d2f]/5 shadow-sm'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                        showResults
                          ? isSelected
                            ? 'bg-[#c41d2f]/10'
                            : 'bg-[var(--color-border)]/40'
                          : 'bg-transparent'
                      }`}
                      style={{ width: showResults ? `${percentage}%` : '0%' }}
                    />

                    {isSelected && showResults && (
                      <div
                        className="absolute bottom-0 left-0 h-0.5 bg-[#c41d2f] animate-expand-x"
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative flex items-center gap-3 z-10 w-full">
                      <div
                        className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          isSelected && showResults
                            ? 'border-[#c41d2f] bg-[#c41d2f]'
                            : 'border-[var(--color-border)]'
                        }`}
                      >
                        {isSelected && showResults && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span
                        className={`text-sm md:text-base font-normal transition-colors flex-grow ${
                          isSelected && showResults
                            ? 'text-[#c41d2f]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      >
                        {option.text}
                      </span>
                      {showResults && (
                        <span
                          className={`text-sm font-bold tabular-nums animate-fade-in ${
                            isSelected ? 'text-[#c41d2f]' : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
            <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              {formatVotes(totalVotes)} votes
            </p>
            {hasVoted && (
              <p className="text-[10px] font-bold text-[#c41d2f] uppercase tracking-wider animate-fade-in-up">
                Thanks for your opinion!
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
