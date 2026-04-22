'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { LocalMedia } from '@/lib/data/upliftLocalMedia';

interface MediaItemProps {
  media: LocalMedia;
  onClick: () => void;
}

export function MediaItem({ media, onClick }: MediaItemProps) {
  const [isLoading, setIsLoading] = useState(true);

  const formatLikes = (likes: number): string => {
    if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}k`;
    }
    return likes.toString();
  };

  return (
    <button
      onClick={onClick}
      className="relative aspect-square w-full overflow-hidden bg-[var(--color-surface)] group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
    >
      <Image
        src={media.thumbnailUrl}
        alt={media.caption || 'Local media'}
        fill
        className={`object-cover transition-all duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } group-hover:scale-105`}
        onLoad={() => setIsLoading(false)}
        sizes="(max-width: 640px) 50vw, 33vw"
      />

      {isLoading && (
        <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse" />
      )}

      {/* Video play icon */}
      {media.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-5 h-5 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-semibold">{formatLikes(media.likes)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
