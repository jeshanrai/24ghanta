'use client';

import { useState, useEffect } from 'react';
import type { Poll as PollType } from '@/lib/data/polls';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PollProps {
  poll?: PollType;
  compact?: boolean;
}

export function Poll({ poll: propPoll, compact = false }: PollProps) {
  const [poll, setPoll] = useState<PollType | null>(propPoll ?? null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(!propPoll);

  useEffect(() => {
    if (propPoll) {
      setPoll(propPoll);
      return;
    }
    // Fetch active poll from API
    fetch(`${API}/api/polls/active`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data) setPoll(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propPoll]);

  const handleVote = async (optionId: string) => {
    if (hasVoted || !poll) return;
    setSelectedOption(optionId);
    setHasVoted(true);
    // Send vote to API
    try {
      await fetch(`${API}/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId: parseInt(optionId) }),
      });
    } catch {
      // Vote recorded locally even if API fails
    }
  };

  if (loading) return null;
  if (!poll) return null;

  const getPercentage = (votes: number): number => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  const formatVotes = (votes: number): string => {
    if (votes >= 1000) {
      return `${(votes / 1000).toFixed(1)}k`;
    }
    return votes.toString();
  };

  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        Quick Poll
      </span>

      {poll.imageUrl && (
        <div className={`relative w-full overflow-hidden rounded-md ${compact ? 'mt-2 aspect-[16/9]' : 'mt-3 aspect-video'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poll.imageUrl}
            alt={poll.question}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <p className={`font-headline text-[var(--color-text-primary)] mt-2 ${compact ? 'text-sm mb-3' : 'text-base mb-4'}`}>
        {poll.question}
      </p>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = getPercentage(option.votes + (selectedOption === option.id ? 1 : 0));
          const isSelected = selectedOption === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted}
              className={`w-full text-left relative overflow-hidden rounded-sm transition-all ${
                hasVoted ? 'cursor-default' : 'cursor-pointer'
              } ${!hasVoted ? 'hover:border-[var(--color-primary)]' : ''}`}
            >
              {/* Background bar */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out ${
                  hasVoted
                    ? isSelected
                      ? 'bg-[#c41d2f]/15'
                      : 'bg-[var(--color-surface)]'
                    : ''
                }`}
                style={{ width: hasVoted ? `${percentage}%` : '0%' }}
              />

              {/* Content */}
              <div className={`relative flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-2.5'} border rounded-sm ${
                isSelected && hasVoted
                  ? 'border-[#c41d2f]'
                  : 'border-[var(--color-border)]'
              }`}>
                <span className="text-sm text-[var(--color-text-primary)]">
                  {option.text}
                </span>
                {hasVoted && (
                  <span className={`text-sm font-semibold ${isSelected ? 'text-[#c41d2f]' : 'text-[var(--color-text-muted)]'}`}>
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-[var(--color-text-muted)]">
        {formatVotes(poll.totalVotes + (hasVoted ? 1 : 0))} votes
      </p>
    </div>
  );
}
