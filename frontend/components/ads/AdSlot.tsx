import { fetchAd, AD_API_URL } from '@/lib/api';
import { AdImpressionTracker } from './AdImpressionTracker';

interface AdSlotProps {
  placement: string;
  className?: string;
  /** Optional Tailwind aspect class to reserve space (e.g. "aspect-[728/90]"). */
  aspectClassName?: string;
  /** Hide the small "Advertisement" label (default: visible for transparency). */
  hideLabel?: boolean;
}

export async function AdSlot({
  placement,
  className = '',
  aspectClassName,
  hideLabel = false,
}: AdSlotProps) {
  const ad = await fetchAd(placement);
  if (!ad) return null;

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.imageUrl}
        alt={ad.altText || ad.name}
        className={`${aspectClassName ? 'absolute inset-0 w-full h-full object-cover' : 'w-full h-auto block'}`}
        loading="lazy"
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
