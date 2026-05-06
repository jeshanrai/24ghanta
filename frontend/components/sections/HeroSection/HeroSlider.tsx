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
      <div className="shine-hover aspect-[16/10] lg:aspect-[16/9] relative overflow-hidden rounded-md shadow-lg">
        {articles.map((art, i) => (
          <Link
            key={art.id}
            href={`/article/${art.slug}`}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              i === current
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-[1.03] z-0'
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
              className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
          </Link>
        ))}

        {/* Gradient overlay — deeper at bottom for stronger text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent z-20 pointer-events-none" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 px-6 sm:px-14 md:px-16 lg:p-8 lg:px-20 z-30">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {article.isBreaking && (
              <div className="inline-flex items-center gap-2 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75 animate-pulse-dot" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-breaking)]" />
                </span>
                <Badge variant="breaking">Breaking</Badge>
              </div>
            )}

            {article.category && (
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-white px-3 py-1.5 rounded-sm shadow-sm"
                style={{
                  background: article.category.color || 'var(--color-primary)',
                }}
              >
                {article.category.name}
              </span>
            )}
          </div>

          <h2
            key={article.id}
            className="font-headline text-h1 lg:text-hero text-white line-clamp-3 transition-all duration-500 ease-out animate-fade-in-up drop-shadow-md max-w-4xl"
          >
            {article.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/80 mb-5">
            {article.author && (
              <>
                <span className="font-medium text-white/90">{article.author.name}</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
              </>
            )}
            {article.publishedAt && (
              <>
                <span>
                  {new Date(article.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
              </>
            )}
            <span>{formatReadTimeShort(article.readTimeMinutes)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Dot indicators */}
            {total > 1 ? (
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
                        ? 'w-8 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            ) : (
              <span />
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 group-hover:text-white transition-colors">
              Read story
              <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Left / Right arrow buttons */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[var(--color-primary)] hover:scale-110 shadow-md"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[var(--color-primary)] hover:scale-110 shadow-md"
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
