'use client';

import Image from 'next/image';
import { useState } from 'react';
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
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const srcInvalid = !isValidImageSrc(src);

  if (hasError || srcInvalid) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] rounded-sm',
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        <FileImage className="opacity-20" size={fill ? 40 : 20} />
      </div>
    );
  }

  const resolved = resolveImageSrc(src);
  
  // NUCLEAR FIX: If the source contains /uploads/, it's a backend image.
  // We MUST skip Vercel optimization to avoid the 502/timeout errors.
  const isBackendImage = typeof src === 'string' && src.includes('/uploads/');
  const shouldSkipOptimization = !!(unoptimized || isBackendImage);

  return (
    <div className={cn('relative overflow-hidden rounded-sm', containerClassName)}>
      <Image
        src={resolved}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        unoptimized={shouldSkipOptimization}
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
