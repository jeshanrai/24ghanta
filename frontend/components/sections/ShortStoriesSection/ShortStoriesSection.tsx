'use client';

import { useState } from 'react';
import type { Video } from '@/lib/types';
import { ShortStoriesCarousel } from './ShortStoriesCarousel';
import { ShortStoriesViewer } from './ShortStoriesViewer';

interface ShortStoriesSectionProps {
  title?: string;
  videos: Video[];
}

export function ShortStoriesSection({
  title = 'Short Stories',
  videos,
}: ShortStoriesSectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (videos.length === 0) return null;

  const handleVideoClick = (index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const handleClose = () => {
    setViewerOpen(false);
  };

  return (
    <>
      <section className="bg-[#1a1a1a] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-[var(--max-width)] mx-auto">
          <div className="flex items-center mb-6">
            <div className="w-12 h-1 bg-[var(--color-primary)] mr-4" />
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">
              {title}
            </h2>
          </div>
          <ShortStoriesCarousel videos={videos} onVideoClick={handleVideoClick} />
        </div>
      </section>

      <ShortStoriesViewer
        videos={videos}
        initialIndex={selectedIndex}
        isOpen={viewerOpen}
        onClose={handleClose}
      />
    </>
  );
}
