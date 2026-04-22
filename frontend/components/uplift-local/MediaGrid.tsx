'use client';

import { useState } from 'react';
import type { LocalMedia } from '@/lib/data/upliftLocalMedia';
import { MediaItem } from './MediaItem';
import { MediaLightbox } from './MediaLightbox';

interface MediaGridProps {
  media: LocalMedia[];
}

export function MediaGrid({ media }: MediaGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {media.map((item, index) => (
          <MediaItem
            key={item.id}
            media={item}
            onClick={() => handleItemClick(index)}
          />
        ))}
      </div>

      {selectedIndex !== null && (
        <MediaLightbox
          media={media[selectedIndex]}
          onClose={handleClose}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
          onNext={selectedIndex < media.length - 1 ? handleNext : undefined}
        />
      )}
    </>
  );
}
