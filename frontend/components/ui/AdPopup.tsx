'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface AdPopupProps {
  imageUrl?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  delayMs?: number;
}

const STORAGE_KEY = '24ghanta_ad_popup_dismissed';

export function AdPopup({
  imageUrl = 'https://picsum.photos/seed/24ghanta-ad/800/450',
  title = 'Stay Updated with 24Ghanta',
  description = 'Get breaking news, exclusive stories, and live updates from across Nepal — straight to your inbox.',
  ctaLabel = 'Subscribe Now',
  ctaHref = '/contact',
  delayMs = 1500,
}: AdPopupProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

    const timer = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  function handleClose() {
    setOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, '1');
    }
  }

  if (!mounted || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-popup-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden animate-scale-in">
        <button
          onClick={handleClose}
          aria-label="Close ad"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative aspect-video w-full bg-[var(--color-surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
          <span className="absolute top-3 left-3 inline-block text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[var(--color-text-primary)] px-2 py-1 rounded-sm">
            Sponsored
          </span>
        </div>

        <div className="p-6">
          <h3
            id="ad-popup-title"
            className="font-headline text-h2 text-[var(--color-text-primary)] leading-snug"
          >
            {title}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {description}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Link
              href={ctaHref}
              onClick={handleClose}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-sm transition-colors"
            >
              {ctaLabel}
            </Link>
            <button
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
