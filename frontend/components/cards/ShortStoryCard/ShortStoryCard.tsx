import Link from 'next/link';
import type { Video } from '@/lib/types';
import { formatDuration } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui';
import { PlayIcon, InstagramReelIcon } from '@/components/icons';

interface ShortStoryCardProps {
  video: Video;
}

export function ShortStoryCard({ video }: ShortStoryCardProps) {
  const isInstagram = video.type === 'instagram';
  const href = isInstagram && video.embedUrl ? video.embedUrl : `/video/${video.slug}`;
  const isExternal = isInstagram && video.embedUrl;

  const CardContent = (
    <div className="aspect-[3/4] relative overflow-hidden rounded-lg cursor-pointer">
      <OptimizedImage
        src={video.thumbnailUrl}
        alt={video.title}
        fill
        containerClassName="w-full h-full relative"
        className="group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-sm font-medium text-white line-clamp-3 leading-snug">
          {video.title}
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-[var(--color-primary)] rounded-full">
            {isInstagram ? (
              <InstagramReelIcon size={16} className="text-white" />
            ) : (
              <PlayIcon size={14} className="text-white ml-0.5" />
            )}
          </div>
          <span className="text-xs text-white/80">{formatDuration(video.durationSeconds)}</span>
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <article className="group flex-shrink-0 w-56 sm:w-64">
        <a href={href} target="_blank" rel="noopener noreferrer" className="block">
          {CardContent}
        </a>
      </article>
    );
  }

  return (
    <article className="group flex-shrink-0 w-56 sm:w-64">
      <Link href={href} className="block">
        {CardContent}
      </Link>
    </article>
  );
}
