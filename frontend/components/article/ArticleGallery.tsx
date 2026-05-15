'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import type { GalleryImage } from '@/lib/types/article';
import { resolveImageSrc } from '@/lib/safeImage';

import { OptimizedImage } from '../ui';

interface ArticleGalleryProps {
  images: GalleryImage[];
}

export function ArticleGallery({ images }: ArticleGalleryProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => setOpenIdx(null), []);
  const next = useCallback(() => {
    setOpenIdx((i) => (i === null ? null : (i + 1) % images.length));
  }, [images.length]);
  const prev = useCallback(() => {
    setOpenIdx((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (openIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [openIdx, close, next, prev]);

  if (!images || images.length === 0) return null;

  return (
    <section className="mt-10 pt-8 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-5">
        <ImageIcon className="w-4 h-4 text-[var(--color-primary)]" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
          Photo gallery
          <span className="ml-2 text-[var(--color-text-muted)] font-normal">
            ({images.length})
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setOpenIdx(idx)}
            className="group relative aspect-[4/3] overflow-hidden rounded-md bg-[var(--color-surface)] cursor-zoom-in"
          >
            <OptimizedImage
              src={img.url}
              alt={img.caption || `Gallery image ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="transition-transform duration-[800ms] group-hover:scale-[1.05]"
            />
            {img.caption && (
              <span className="absolute inset-x-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[11px] line-clamp-2 z-10">
                {img.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {mounted && openIdx !== null && images[openIdx] && createPortal(
        <div
          className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-[130]"
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-[130]"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-[130]"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          <figure
            className="relative max-w-5xl flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={openIdx}
              src={resolveImageSrc(images[openIdx].url)}
              alt={images[openIdx].caption || `Gallery image ${openIdx + 1}`}
              className="max-w-[92vw] max-h-[80vh] w-auto h-auto object-contain block"
            />
            {images[openIdx].caption && (
              <figcaption className="mt-4 text-sm text-white/90 text-center max-w-2xl px-4 animate-fade-in stagger-2">
                {images[openIdx].caption}
              </figcaption>
            )}
            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              {openIdx + 1} / {images.length}
            </div>
          </figure>
        </div>,
        document.body
      )}
    </section>
  );
}
