'use client';

import { useRef } from 'react';
import type { Video } from '@/lib/types';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, InstagramReelIcon } from '@/components/icons';
import { OptimizedImage } from '@/components/ui';
import { formatDuration } from '@/lib/utils';

interface ShortStoriesCarouselProps {
  videos: Video[];
  onVideoClick: (index: number) => void;
}

export function ShortStoriesCarousel({ videos, onVideoClick }: ShortStoriesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 280;
    const newScrollLeft =
      direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 pr-20"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {videos.map((video, index) => {
          const isInstagram = video.type === 'instagram';

          return (
            <div key={video.id} style={{ scrollSnapAlign: 'start' }}>
              <article className="group flex-shrink-0 w-56 sm:w-64">
                <button
                  onClick={() => onVideoClick(index)}
                  className="block w-full text-left"
                >
                  <div className="aspect-[3/4] relative overflow-hidden rounded-lg cursor-pointer">
                    <OptimizedImage
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      containerClassName="w-full h-full relative"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-sm font-medium text-white line-clamp-3 leading-snug">
                        {video.title}
                      </h3>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-primary)] rounded-full">
                          {isInstagram ? (
                            <InstagramReelIcon size={16} className="text-white" />
                          ) : (
                            <PlayIcon size={14} className="text-white ml-0.5" />
                          )}
                        </div>
                        <span className="text-xs text-white/80">
                          {formatDuration(video.durationSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows - positioned at top right like AP News */}
      <div className="hidden sm:flex items-center gap-2 absolute -top-14 right-0">
        <button
          onClick={() => scroll('left')}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/30 text-white/70 hover:bg-white/10 hover:text-white transition-colors duration-200"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <button
          onClick={() => scroll('right')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors duration-200"
          aria-label="Scroll right"
        >
          <ChevronRightIcon size={20} />
        </button>
      </div>
    </div>
  );
}
