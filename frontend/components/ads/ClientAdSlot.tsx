'use client';

import { useState, useEffect } from 'react';
import { fetchAd, AD_API_URL } from '@/lib/api';
import { AdImpressionTracker } from './AdImpressionTracker';
import { AdImage } from './AdImage';
import type { Ad } from '@/lib/types';

interface ClientAdSlotProps {
  placement: string;
  className?: string;
  aspectClassName?: string;
  hideLabel?: boolean;
}

export function ClientAdSlot({
  placement,
  className = '',
  aspectClassName,
  hideLabel = false,
}: ClientAdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAd(placement).then((data) => {
      setAd(data);
      setLoading(false);
    });
  }, [placement]);

  if (loading || !ad) return null;

  const sponsoredLabel = !hideLabel && (
    <span className="absolute top-1 left-1 z-10 text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded-sm">
      Ad
    </span>
  );

  if (ad.adType === 'html' && ad.htmlContent) {
    return (
      <div
        className={`relative w-full ${className}`}
        data-ad-placement={placement}
      >
        {sponsoredLabel}
        <AdImpressionTracker adId={ad.id} />
        <div dangerouslySetInnerHTML={{ __html: ad.htmlContent }} />
      </div>
    );
  }

  if (!ad.imageUrl) return null;

  const clickHref = ad.linkUrl
    ? `${AD_API_URL}/api/ads/${ad.id}/click`
    : undefined;

  const inner = (
    <div
      className={`relative w-full overflow-hidden rounded-sm bg-[var(--color-surface)] ${aspectClassName || ''}`}
    >
      {sponsoredLabel}
      <AdImpressionTracker adId={ad.id} />
      <AdImage 
        imageUrl={ad.imageUrl}
        altText={ad.altText || ''}
        name={ad.name}
        aspectClassName={aspectClassName}
      />
    </div>
  );

  return clickHref ? (
    <a
      href={clickHref}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={`block ${className}`}
      data-ad-placement={placement}
    >
      {inner}
    </a>
  ) : (
    <div className={className} data-ad-placement={placement}>
      {inner}
    </div>
  );
}
