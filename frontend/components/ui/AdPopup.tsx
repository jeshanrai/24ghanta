'use client';

import { useEffect, useState } from 'react';
import { resolveImageSrc } from '@/lib/safeImage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const STORAGE_KEY = '24ghanta_ad_popup_dismissed';

interface AdPopupAd {
  id: string;
  adType: 'image' | 'html';
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
  htmlContent?: string;
  name?: string;
}

interface AdPopupProps {
  ad?: AdPopupAd | null;
  delayMs?: number;
}

export function AdPopup({ ad, delayMs = 5000 }: AdPopupProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (!ad) return;
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;

    const timer = setTimeout(() => {
      setOpen(true);
      // Track impression
      fetch(`${API}/api/ads/${ad.id}/impression`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => {});
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs, ad]);

  useEffect(() => {
    if (!open) return;
    
    // Auto-dismiss after 3 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 3000);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(autoCloseTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, '1');
    }
  }

  if (!mounted || !open || !ad) return null;

  const clickHref = ad.linkUrl ? `${API}/api/ads/${ad.id}/click` : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={ad.name || 'Advertisement'}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden animate-scale-in">

        <span className="absolute top-3 left-3 z-10 inline-block text-[10px] font-bold uppercase tracking-wider bg-white/90 text-[var(--color-text-primary)] px-2 py-1 rounded-sm">
          Advertisement
        </span>

        {ad.adType === 'html' && ad.htmlContent ? (
          <div
            className="p-6"
            dangerouslySetInnerHTML={{ __html: ad.htmlContent }}
          />
        ) : ad.imageUrl ? (
          clickHref ? (
            <a
              href={clickHref}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={handleClose}
              className="block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageSrc(ad.imageUrl)}
                alt={ad.altText || ad.name || 'Advertisement'}
                className="w-full h-auto block"
              />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.altText || ad.name || 'Advertisement'}
              className="w-full h-auto block"
            />
          )
        ) : null}
      </div>
    </div>
  );
}
