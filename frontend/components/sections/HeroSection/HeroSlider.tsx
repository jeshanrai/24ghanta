'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const goTo = (index: number) => {
    setCurrent(index);
  };

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, isPaused, total]);

  if (articles.length === 0) return null;

  const article = articles[current];

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="shine-hover aspect-[16/10] lg:aspect-[16/9] relative overflow-hidden rounded-sm">
        {articles.map((art, i) => (
          <Link
            key={art.id}
            href={`/article/${art.slug}`}
            className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              i === current
                ? 'opacity-100 scale-100 z-10'
                : 'opacity-0 scale-105 z-0'
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
              className="transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
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

          {/* Category badge */}
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

          <div className="mt-2 flex items-center gap-3 text-xs text-white/70">
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
        </div>

        {/* Slide indicators + progress bar */}
        {total > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-30 flex items-end">
            <div className="w-full flex">
              {articles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="flex-1 h-8 flex items-end cursor-pointer group/dot"
                  aria-label={`Go to slide ${i + 1}`}
                >
                  <div className="w-full h-[3px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20" />
                    <div
                      className={`absolute inset-y-0 left-0 bg-white transition-all ${
                        i === current
                          ? isPaused
                            ? 'w-full duration-0'
                            : 'w-full duration-[5000ms] ease-linear'
                          : i < current
                          ? 'w-full duration-0'
                          : 'w-0 duration-0'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide counter */}
      {total > 1 && (
        <div className="absolute top-3 right-3 z-30 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider">
          {current + 1} / {total}
        </div>
      )}
    </div>
  );
}
