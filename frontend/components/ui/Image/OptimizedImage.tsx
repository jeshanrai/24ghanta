'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidImageSrc, resolveImageSrc } from '@/lib/safeImage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  className?: string;
  containerClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  sizes?: string;
  style?: React.CSSProperties;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  unoptimized,
  className,
  containerClassName,
  objectFit = 'cover',
  sizes,
  style,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useUnoptimized, setUseUnoptimized] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const srcInvalid = !isValidImageSrc(src);
  const resolved = resolveImageSrc(src);

  // If the image is already cached, the browser may not fire `onLoad` after
  // mount. Check the underlying <img>'s complete flag and clear the loading
  // state so a cached image isn't stuck behind the placeholder.
  useEffect(() => {
    if (!isLoading) return;
    const img = wrapperRef.current?.querySelector('img');
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoading(false);
    }
  }, [resolved, isLoading]);

  if (hasError || srcInvalid) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] rounded-sm p-4 relative',
          containerClassName
        )}
        style={!fill ? { width, height, ...style } : { ...style }}
      >
        <FileImage className="opacity-20 mb-2" size={fill ? 40 : 20} />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'relative overflow-hidden rounded-sm bg-[var(--color-surface-hover)]',
        fill && 'w-full h-full',
        containerClassName
      )}
      style={style}
    >
      <Image
        src={resolved}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        // Try Vercel optimization first. Fallback to unoptimized only if it fails.
        unoptimized={unoptimized || useUnoptimized}
        sizes={sizes || (fill ? '100vw' : undefined)}
        className={cn(
          'transition-all duration-700 ease-in-out',
          isLoading ? 'opacity-0 scale-[1.02] blur-sm' : 'opacity-100 scale-100 blur-0',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          // If we haven't tried unoptimized yet, try it now.
          // This handles cases where Vercel's proxy fails (502/504) due to file size (>4MB)
          // or external origin issues.
          if (!useUnoptimized) {
            console.warn(`OptimizedImage: Optimization failed for ${resolved}, falling back to raw source.`);
            setUseUnoptimized(true);
            // We keep isLoading true to show placeholder until raw source loads
          } else {
            setHasError(true);
            setIsLoading(false);
          }
        }}
        decoding="async"
      />
      
      {/* Premium Shimmer Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[var(--color-surface-hover)]" />
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"
            style={{ 
              backgroundSize: '200% 100%',
              animationDuration: '1.5s'
            }}
          />
        </div>
      )}
    </div>
  );
}
