'use client';

import { useState } from 'react';
import { getPolls } from '@/lib/data/polls';

export function PollCard() {
  const polls = getPolls();
  const poll = polls[1]; // Use second poll for sidebar variety

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  if (!poll) return null;

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    setSelectedOption(optionId);
    setHasVoted(true);
  };

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
    <div className="relative overflow-hidden rounded-sm bg-gradient-to-br from-[#f0f4f8] to-[#e8eef4] p-5 border border-[#d4dde6]">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#3b82f6]/10 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-[#8b5cf6]/10 blur-2xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#3b82f6] text-white text-xs font-bold uppercase tracking-wide mb-3">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Poll</span>
        </div>

        {/* Question */}
        <h3 className="text-base font-bold text-[#1a1a1a] mb-3 leading-snug">
          {poll.question}
        </h3>

        {/* Options */}
        <div className="space-y-2">
          {poll.options.map((option) => {
            const percentage = getPercentage(option.votes + (selectedOption === option.id ? 1 : 0));
            const isSelected = selectedOption === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted}
                className={`w-full text-left relative overflow-hidden rounded transition-all ${
                  hasVoted ? 'cursor-default' : 'cursor-pointer hover:bg-white/50'
                } ${isSelected ? 'ring-2 ring-[#3b82f6] ring-offset-1' : ''}`}
              >
                {/* Background bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    hasVoted
                      ? isSelected
                        ? 'bg-[#3b82f6]/20'
                        : 'bg-[#d4dde6]'
                      : ''
                  }`}
                  style={{ width: hasVoted ? `${percentage}%` : '0%' }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between px-3 py-2 border border-[#d4dde6] rounded bg-white/60">
                  <span className="text-sm text-[#1a1a1a]">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm font-semibold text-[#6b7280]">
                      {percentage}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-3 text-xs text-[#6b7280]">
          <span>{formatVotes(poll.totalVotes + (hasVoted ? 1 : 0))} votes</span>
        </div>
      </div>
    </div>
  );
}
