'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
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
  const [showResults, setShowResults] = useState(false);

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
    
    // Smooth reveal of results
    setTimeout(() => {
      setShowResults(true);
    }, 100);

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
    const total = poll.totalVotes + (hasVoted ? 1 : 0);
    const currentVotes = votes + (selectedOption === poll.options.find(o => o.votes === votes)?.id ? 1 : 0);
    return Math.round((currentVotes / total) * 100);
  };

  const formatVotes = (votes: number): string => {
    if (votes >= 1000) {
      return `${(votes / 1000).toFixed(1)}k`;
    }
    return votes.toString();
  };

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Quick Poll
        </span>
        {hasVoted && (
          <span className="text-[10px] font-bold text-[#c41d2f] bg-[#c41d2f]/10 px-2 py-0.5 rounded-full animate-fade-in">
            Voted
          </span>
        )}
      </div>

      {poll.imageUrl && (
        <div className={`relative w-full overflow-hidden rounded-md ${compact ? 'mt-2 aspect-[16/9]' : 'mt-3 aspect-video'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poll.imageUrl}
            alt={poll.question}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <p className={`font-headline text-[var(--color-text-primary)] mt-3 ${compact ? 'text-lg mb-3' : 'text-xl mb-4'}`}>
        {poll.question}
      </p>

      <div className="space-y-2.5">
        {poll.options.map((option) => {
          const isSelected = selectedOption === option.id;
          const percentage = getPercentage(option.votes);

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted}
              className={`w-full text-left relative overflow-hidden rounded-md transition-all group ${
                hasVoted ? 'cursor-default' : 'cursor-pointer hover:translate-x-1'
              }`}
            >
              {/* Background bar */}
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out ${
                  showResults
                    ? isSelected
                      ? 'bg-[#c41d2f]/20'
                      : 'bg-[var(--color-surface-hover)]'
                    : 'bg-transparent'
                }`}
                style={{ width: showResults ? `${percentage}%` : '0%' }}
              />

              {/* Progress indicator for selected option */}
              {isSelected && showResults && (
                <div className="absolute inset-0 bg-[#c41d2f]/5 animate-pulse" />
              )}

              {/* Content */}
              <div className={`relative flex items-center justify-between ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} border rounded-md transition-colors duration-300 ${
                isSelected && showResults
                  ? 'border-[#c41d2f] bg-[#c41d2f]/5'
                  : 'border-[var(--color-border)] group-hover:border-[var(--color-text-muted)]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium transition-colors ${
                    isSelected && showResults ? 'text-[#c41d2f]' : 'text-[var(--color-text-primary)]'
                  }`}>
                    {option.text}
                  </span>
                  {isSelected && showResults && (
                    <Check className="w-3.5 h-3.5 text-[#c41d2f] animate-scale-in" />
                  )}
                </div>
                
                {showResults && (
                  <span className={`text-sm font-bold animate-fade-in ${
                    isSelected ? 'text-[#c41d2f]' : 'text-[var(--color-text-muted)]'
                  }`}>
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          {formatVotes(poll.totalVotes + (hasVoted ? 1 : 0))} votes
        </p>
        {hasVoted && (
          <p className="text-xs font-medium text-[#c41d2f] animate-fade-in-up">
            Thanks for your opinion!
          </p>
        )}
      </div>
    </div>
  );
}
