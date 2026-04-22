'use client';

import { useState } from 'react';

interface Reactions {
  fire: number;
  laugh: number;
  wow: number;
  hundred: number;
  heart: number;
}

interface ReactionBarProps {
  initialReactions?: Partial<Reactions>;
  size?: 'sm' | 'md';
}

const defaultReactions: Reactions = {
  fire: 0,
  laugh: 0,
  wow: 0,
  hundred: 0,
  heart: 0,
};

const reactionEmojis = {
  fire: '🔥',
  laugh: '😂',
  wow: '😮',
  hundred: '💯',
  heart: '❤️',
};

export function ReactionBar({ initialReactions = {}, size = 'md' }: ReactionBarProps) {
  const [reactions, setReactions] = useState<Reactions>({
    ...defaultReactions,
    ...initialReactions,
  });
  const [clickedReaction, setClickedReaction] = useState<string | null>(null);

  const handleReaction = (type: keyof Reactions) => {
    setReactions((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
    setClickedReaction(type);
    setTimeout(() => setClickedReaction(null), 300);
  };

  const sizeClasses = size === 'sm'
    ? 'gap-2 text-xs'
    : 'gap-3 text-sm';

  const buttonClasses = size === 'sm'
    ? 'px-2 py-1 gap-1'
    : 'px-3 py-1.5 gap-1.5';

  return (
    <div className={`flex items-center ${sizeClasses}`}>
      {(Object.keys(reactionEmojis) as Array<keyof Reactions>).map((type) => (
        <button
          key={type}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReaction(type);
          }}
          className={`
            flex items-center ${buttonClasses}
            bg-[var(--genz-surface-hover)] hover:bg-[var(--genz-surface-hover)]/80
            rounded-full transition-all duration-200
            hover:scale-110 active:scale-95
            ${clickedReaction === type ? 'scale-125' : ''}
          `}
        >
          <span className={`${clickedReaction === type ? 'animate-bounce' : ''}`}>
            {reactionEmojis[type]}
          </span>
          {reactions[type] > 0 && (
            <span className="text-[var(--genz-text-muted)] font-medium">
              {reactions[type]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
