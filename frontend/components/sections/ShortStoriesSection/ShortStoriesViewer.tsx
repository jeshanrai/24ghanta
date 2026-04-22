'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Video } from '@/lib/types';
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

interface ShortStoriesViewerProps {
  videos: Video[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds per story

export function ShortStoriesViewer({
  videos,
  initialIndex,
  isOpen,
  onClose,
}: ShortStoriesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentVideo = videos[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, videos.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Reset state when opening with new index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialIndex]);

  // Auto-advance progress
  useEffect(() => {
    if (!isOpen || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (STORY_DURATION / 100));
        if (newProgress >= 100) {
          goToNext();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentVideo) return null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // Left third goes back, right two-thirds goes forward
    if (clickX < width / 3) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Navigation arrows - desktop only */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Previous story"
        >
          <ChevronLeftIcon size={28} />
        </button>
      )}

      {currentIndex < videos.length - 1 && (
        <button
          onClick={goToNext}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 items-center justify-center text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Next story"
        >
          <ChevronRightIcon size={28} />
        </button>
      )}

      {/* Story card container */}
      <div
        className="relative w-full h-full sm:w-auto sm:h-auto cursor-pointer"
        onClick={handleClick}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story card - full screen mobile, 9:16 aspect on larger screens */}
        <div className="relative w-full h-full sm:w-[min(380px,90vw)] sm:h-[min(675px,85vh)] sm:aspect-[9/16] sm:rounded-2xl overflow-hidden">
          {/* Background image */}
          <Image
            src={currentVideo.thumbnailUrl}
            alt={currentVideo.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

          {/* Progress bars - inside the card */}
          <div className="absolute top-0 left-0 right-0 z-10 flex gap-[3px] px-3 pt-3 safe-area-inset-top">
            {videos.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width:
                      index < currentIndex
                        ? '100%'
                        : index === currentIndex
                        ? `${progress}%`
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Close button - inside the card */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-10 right-3 z-10 w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center text-white bg-black/30 sm:bg-transparent hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <CloseIcon size={26} className="sm:w-[22px] sm:h-[22px]" />
          </button>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 sm:pb-6">
            {/* Category badge */}
            {currentVideo.category && (
              <span className="inline-block px-2.5 py-1 text-xs font-semibold text-white bg-[var(--color-primary)] rounded-sm mb-3">
                {currentVideo.category.name}
              </span>
            )}

            {/* Title */}
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug mb-2">
              {currentVideo.title}
            </h2>

            {/* Description if available */}
            {currentVideo.description && (
              <p className="text-xs sm:text-sm text-white/70 line-clamp-2">
                {currentVideo.description}
              </p>
            )}
          </div>

          {/* Pause indicator */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 flex items-center justify-center bg-black/40 rounded-full">
                <div className="flex gap-1">
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                  <div className="w-1.5 h-6 bg-white rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* Story counter */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-xs">
            {currentIndex + 1} / {videos.length}
          </div>
        </div>
      </div>
    </div>
  );
}
