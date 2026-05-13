'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { ClientAdSlot } from '@/components/ads';
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
    if (poll?.id) {
      const votedOptionId = localStorage.getItem(`voted_poll_${poll.id}`);
      if (votedOptionId) {
        setHasVoted(true);
        setSelectedOption(votedOptionId);
        setShowResults(true);
      }
    }
  }, [poll?.id]);

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
    localStorage.setItem(`voted_poll_${poll.id}`, optionId);
    
    // Update local state for immediate feedback
    setPoll(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalVotes: prev.totalVotes + 1,
        options: prev.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
      };
    });

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
      // Already updated locally
    }
  };

  if (loading) return null;
  if (!poll) return null;

  const getPercentage = (option: any): number => {
    const total = poll.totalVotes;
    if (total === 0) return 0;
    return Math.round((option.votes / total) * 100);
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
        <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-[var(--color-text-primary)]">
          Quick Poll
        </span>
        {hasVoted && (
          <span className="text-[10px] font-bold text-[#c41d2f] bg-[#c41d2f]/10 px-2 py-0.5 rounded-full animate-fade-in">
            Voted
          </span>
        )}
      </div>

      <div className={`mt-3 ${poll.imageUrl ? 'grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-4' : ''}`}>
        {poll.imageUrl && (
          <div className="relative overflow-hidden rounded-md w-full min-h-[200px] md:min-h-0 md:h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={poll.imageUrl}
              alt={poll.question}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        <div className={`flex flex-col justify-center ${poll.imageUrl ? 'max-h-[400px]' : ''}`}>
          <p className={`font-headline text-[var(--color-text-primary)] ${compact ? 'text-sm mb-2 leading-tight' : 'text-base mb-3'}`}>
            {poll.question}
          </p>

          <div className={`space-y-2 ${poll.imageUrl ? 'overflow-y-auto pr-1 custom-scrollbar' : ''}`}>
            {poll.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const percentage = getPercentage(option);

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
                  <div className={`relative flex items-center justify-between ${compact ? 'px-3 py-2' : 'px-4 py-3'} border rounded-md transition-colors duration-300 ${
                    isSelected && showResults
                      ? 'border-[#c41d2f] bg-[#c41d2f]/5'
                      : 'border-[var(--color-border)] group-hover:border-[var(--color-text-muted)]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium transition-colors ${
                        isSelected && showResults ? 'text-[#c41d2f]' : 'text-[var(--color-text-primary)]'
                      }`}>
                        {option.text}
                      </span>
                      {isSelected && showResults && (
                        <Check className="w-3.5 h-3.5 text-[#c41d2f] animate-scale-in" />
                      )}
                    </div>

                    {showResults && (
                      <span className={`text-xs font-bold animate-fade-in ${
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

          <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-2">
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {formatVotes(poll.totalVotes)} votes
            </p>
            {hasVoted && (
              <p className="text-[10px] font-medium text-[#c41d2f] animate-fade-in-up">
                Thanks for your opinion!
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-[320px]">
          <ClientAdSlot placement="poll_sidebar" aspectClassName="aspect-[2/1]" />
        </div>
      </div>
    </div>
  );
}
