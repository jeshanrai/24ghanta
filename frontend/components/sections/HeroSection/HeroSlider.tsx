'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/types';
import { formatReadTimeShort } from '@/lib/utils';
import { OptimizedImage, Badge } from '@/components/ui';

interface HeroSliderProps {
  articles: Article[];
}

export function HeroSlider({ articles }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = articles.length;
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((p) => (p - 1 + total) % total);
  }, [total]);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  // Auto-advance every 5 seconds — infinite loop
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isPaused, total]);

  // Touch / swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const minSwipe = 50;
    if (Math.abs(distance) >= minSwipe) {
      if (distance > 0) next();
      else prev();
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  if (articles.length === 0) return null;

  const article = articles[current];

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div className="shine-hover aspect-[16/10] lg:aspect-[16/9] relative overflow-hidden rounded-sm">
        {articles.map((art, i) => (
          <Link
            key={art.id}
            href={`/article/${art.slug}`}
            className={`absolute inset-0 transition-all duration-500 ease-out ${
              i === current
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-[1.02] z-0'
            }`}
            aria-hidden={i !== current}
            tabIndex={i === current ? 0 : -1}
          >
            <OptimizedImage
              src={art.imageUrl}
              alt={art.imageAlt}
              fill
              priority={i === 0}
              containerClassName="w-full h-full relative"
              className="transition-transform duration-500 ease-out"
            />
          </Link>
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-20 pointer-events-none" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 z-30">
          {article.isBreaking && (
            <div className="mb-3 inline-flex items-center gap-2 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75 animate-pulse-dot" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-breaking)]" />
              </span>
              <Badge variant="breaking">Breaking</Badge>
            </div>
          )}

          {article.category && (
            <div className="mb-2">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-sm">
                {article.category.name}
              </span>
            </div>
          )}

          <h2
            key={article.id}
            className="font-headline text-h1 lg:text-hero text-white line-clamp-3 transition-all duration-500 ease-out animate-fade-in-up"
          >
            {article.title}
          </h2>

          <div className="mt-2 flex items-center gap-3 text-xs text-white/70 mb-4">
            <span>{formatReadTimeShort(article.readTimeMinutes)}</span>
            {article.author && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>{article.author.name}</span>
              </>
            )}
            {article.publishedAt && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>

          {/* Dot indicators at the bottom */}
          {total > 1 && (
            <div className="flex items-center gap-1.5">
              {articles.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(i);
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Left / Right arrow buttons (visible on hover, desktop) */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            aria-label="Next slide"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
