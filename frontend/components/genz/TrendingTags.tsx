'use client';

import { useState, useRef } from 'react';

interface Tag {
  id: string;
  label: string;
  count?: number;
}

interface TrendingTagsProps {
  tags: Tag[];
  onTagClick?: (tagId: string) => void;
  selectedTag?: string | null;
}

const tagColors = [
  'from-[#FF6B6B] to-[#FFE66D]',
  'from-[#4ECDC4] to-[#95E1D3]',
  'from-[#AA96DA] to-[#6C5CE7]',
  'from-[#F38181] to-[#FF6B6B]',
  'from-[#FFE66D] to-[#FD9644]',
  'from-[#95E1D3] to-[#4ECDC4]',
  'from-[#6C5CE7] to-[#AA96DA]',
  'from-[#FD9644] to-[#FF6B6B]',
];

export function TrendingTags({ tags, onTagClick, selectedTag }: TrendingTagsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTagClick = (tagId: string) => {
    onTagClick?.(tagId);
  };

  return (
    <div className="relative">
      {/* Gradient fade on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--genz-bg)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--genz-bg)] to-transparent z-10 pointer-events-none" />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-2 -mx-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tags.map((tag, index) => {
          const colorClass = tagColors[index % tagColors.length];
          const isSelected = selectedTag === tag.id;

          return (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.id)}
              className={`
                flex-shrink-0 flex items-center gap-2
                px-4 py-2 rounded-full
                font-semibold text-sm
                transition-all duration-300
                ${isSelected
                  ? `bg-gradient-to-r ${colorClass} text-black shadow-lg scale-105`
                  : 'bg-[var(--genz-surface)] text-[var(--genz-text)] hover:bg-[var(--genz-surface-hover)]'
                }
                hover:scale-105 active:scale-95
              `}
            >
              <span className="text-base">#</span>
              <span>{tag.label}</span>
              {tag.count && (
                <span className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isSelected ? 'bg-black/20' : 'bg-[var(--genz-surface-hover)]'}
                `}>
                  {tag.count > 999 ? `${(tag.count / 1000).toFixed(1)}k` : tag.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Default trending tags for Gen Z content
export const defaultTrendingTags: Tag[] = [
  { id: 'viral', label: 'Viral', count: 2400 },
  { id: 'trending', label: 'Trending', count: 1800 },
  { id: 'tech', label: 'Tech', count: 1200 },
  { id: 'entertainment', label: 'Entertainment', count: 980 },
  { id: 'memes', label: 'Memes', count: 756 },
  { id: 'gaming', label: 'Gaming', count: 654 },
  { id: 'music', label: 'Music', count: 543 },
  { id: 'fashion', label: 'Fashion', count: 432 },
  { id: 'food', label: 'Food', count: 321 },
  { id: 'travel', label: 'Travel', count: 210 },
];
