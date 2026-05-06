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
  const [visible, setVisible] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Slight delay before starting to show the ad to catch the eye
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Handle cached images that load before React attaches the onLoad event
  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-xs text-white bg-red-600 font-bold animate-pulse">
        IMAGE LOAD ERROR
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden transition-all duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Loading Shimmer */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
      )}
      
      <img
        ref={imgRef}
        src={resolveImageSrc(imageUrl)}
        alt={altText || name}
        className={`transition-opacity duration-700 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${aspectClassName ? 'absolute inset-0 w-full h-full object-contain' : 'w-full h-auto block'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />

      {/* Interactive Shine Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
