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

  const srcInvalid = !isValidImageSrc(src);
  const resolved = resolveImageSrc(src);

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
      className={cn(
        'relative overflow-hidden rounded-sm', 
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
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          // If we haven't tried unoptimized yet, try it now.
          // This handles cases where Vercel's proxy fails (502) due to file size.
          if (!useUnoptimized) {
            console.warn(`OptimizedImage: Vercel optimization failed for ${resolved}, falling back to raw source.`);
            setUseUnoptimized(true);
          } else {
            setHasError(true);
          }
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse" />
      )}
    </div>
  );
}
