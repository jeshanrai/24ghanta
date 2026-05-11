'use client';

import { useState, useEffect, useRef } from 'react';
import { resolveImageSrc } from '@/lib/safeImage';

interface AdImageProps {
  imageUrl: string;
  altText?: string;
  name?: string;
  aspectClassName?: string;
}

export function AdImage({ imageUrl, altText, name, aspectClassName }: AdImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle cached images
  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] text-muted-foreground bg-muted p-2">
        <span className="font-bold mb-1">Image Error</span>
        <span className="truncate w-full text-center">{imageUrl}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      <img
        ref={imgRef}
        src={resolveImageSrc(imageUrl)}
        alt={altText || name}
        className={`${aspectClassName ? 'absolute inset-0 w-full h-full object-cover' : 'w-full h-auto block'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
}
