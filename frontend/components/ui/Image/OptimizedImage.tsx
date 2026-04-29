'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { isValidImageSrc, resolveImageSrc } from '@/lib/safeImage';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  containerClassName,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const srcInvalid = !isValidImageSrc(src);

  if (hasError || srcInvalid) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--color-surface)] rounded-sm',
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-[var(--color-text-muted)] text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-sm', containerClassName)}>
      <Image
        src={resolveImageSrc(src)}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse" />
      )}
    </div>
  );
}
