import Link from 'next/link';
import type { Video } from '@/lib/types';
import { OptimizedImage } from '@/components/ui';
import { DurationBadge } from './DurationBadge';
import { PlayOverlay } from './PlayOverlay';

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <article className="group">
      <Link href={`/video/${video.slug}`} className="block">
        <div className="shine-hover aspect-video relative overflow-hidden rounded-sm">
          <OptimizedImage
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            containerClassName="w-full h-full relative"
            className="group-hover:scale-[1.07] transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
          <PlayOverlay />
          <DurationBadge seconds={video.durationSeconds} />
        </div>
        <div className="mt-3">
          <h3 className="font-headline text-h3 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-200 line-clamp-2">
            {video.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}
