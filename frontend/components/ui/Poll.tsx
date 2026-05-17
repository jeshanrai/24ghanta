'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { ClientAdSlot } from '@/components/ads';
import { SafeImage } from '@/components/ui/Image/SafeImage';
import { resolveImageSrc } from '@/lib/safeImage';
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
    const total = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
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
    <div className="relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl md:text-2xl font-headline font-extrabold uppercase tracking-tight text-[var(--color-text-primary)]">
            Quick Poll
          </span>
        </div>
        {hasVoted && (
          <span className="text-[10px] md:text-xs font-bold text-[#16a34a] bg-[#16a34a]/10 px-3 py-1 rounded-full animate-fade-in border border-[#16a34a]/20 flex items-center gap-1">
            <Check className="w-3 h-3" />
            Voted
          </span>
        )}
      </div>

      <div className={`mt-4 ${poll.imageUrl ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr] gap-6' : ''}`}>
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
          <h3 className={`font-headline text-[var(--color-text-primary)] tracking-tight ${compact ? 'text-base md:text-lg mb-4 leading-snug' : 'text-lg md:text-2xl mb-5'}`}>
            {poll.question}
          </h3>

          <div className={`space-y-3 ${poll.imageUrl ? 'overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
            {poll.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const percentage = getPercentage(option);

              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={hasVoted}
                  className={`w-full text-left relative overflow-hidden rounded-lg transition-all duration-300 ${
                    hasVoted ? 'cursor-default' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  <div className={`relative flex items-center justify-between ${compact ? 'px-4 py-3' : 'px-5 py-4'} border rounded-lg transition-all duration-500 ${
                    isSelected && showResults
                      ? 'border-[#c41d2f] bg-[#c41d2f]/5 shadow-sm'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)] bg-[var(--color-surface)]'
                  }`}>
                    {/* Animated Progress bar */}
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${
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
                      <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isSelected && showResults 
                          ? 'border-[#c41d2f] bg-[#c41d2f]' 
                          : hasVoted 
                            ? 'border-[var(--color-border)]' 
                            : 'border-[var(--color-border)] group-hover:border-[var(--color-text-muted)]'
                      }`}>
                        {isSelected && showResults && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      
                      <span className={`text-sm md:text-base font-normal transition-colors flex-grow ${
                        isSelected && showResults ? 'text-[#c41d2f]' : 'text-[var(--color-text-primary)]'
                      }`}>
                        {option.text}
                      </span>

                      {showResults && (
                        <span className={`text-sm font-bold tabular-nums animate-fade-in ${
                          isSelected ? 'text-[#c41d2f]' : 'text-[var(--color-text-muted)]'
                        }`}>
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
              {formatVotes(poll.options.reduce((acc, curr) => acc + curr.votes, 0))} votes
            </p>
            {hasVoted && (
              <p className="text-[10px] font-bold text-[#c41d2f] uppercase tracking-wider animate-fade-in-up">
                Thanks for your opinion!
              </p>
            )}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-8 flex justify-center border-t border-[var(--color-border)] pt-6">
          <div className="w-full max-w-[320px] opacity-80 hover:opacity-100 transition-opacity">
            <ClientAdSlot placement="poll_sidebar" aspectClassName="aspect-[2/1]" />
          </div>
        </div>
      )}
    </div>
  );
}
