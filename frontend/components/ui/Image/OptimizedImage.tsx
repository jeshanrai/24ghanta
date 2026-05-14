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
        {/* Debug info to help the user identify origin mismatches on Vercel */}
        <div className="absolute bottom-2 inset-x-2 flex flex-col items-center opacity-30 pointer-events-none">
          <span className="text-[8px] truncate w-full text-center font-mono">
            {typeof resolved === 'string' ? new URL(resolved).hostname : ''}
          </span>
          <span className="text-[7px] truncate w-full text-center font-mono uppercase mt-0.5">
            {typeof resolved === 'string' ? resolved.split('/').pop() : 'Invalid'}
          </span>
        </div>
      </div>
    );
  }

  // NUCLEAR FIX: If the source contains /uploads/, it's a backend image.
  // We MUST skip Vercel optimization to avoid the 502/timeout errors.
  // We check the 'resolved' URL because older articles might only store the 
  // raw filename which resolveImageSrc then expands.
  const isBackendImage = typeof resolved === 'string' && resolved.includes('/uploads/');
  const shouldSkipOptimization = !!(unoptimized || isBackendImage);

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
        unoptimized={shouldSkipOptimization}
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
        onError={() => setHasError(true)}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse" />
      )}
    </div>
  );
}
