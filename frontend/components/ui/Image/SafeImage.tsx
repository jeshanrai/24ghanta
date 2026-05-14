"use client";

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { FileImage } from 'lucide-react';
import { isValidImageSrc, resolveImageSrc } from '@/lib/safeImage';

type SafeImageProps = ImageProps & {
  fallbackClassName?: string;
};

/**
 * Drop-in replacement for next/image that renders a graceful fallback
 * (instead of crashing) when the `src` is missing/empty/malformed.
 * Safe to use in both server and client components.
 */
export function SafeImage({ src, alt, fallbackClassName, unoptimized, ...rest }: SafeImageProps) {
  const [error, setError] = useState(false);

  if (!isValidImageSrc(src) || error) {
    const style =
      !rest.fill && (rest.width || rest.height)
        ? { width: rest.width as number | undefined, height: rest.height as number | undefined }
        : undefined;
    return (
      <div
        aria-label={alt}
        className={
          fallbackClassName ||
          'flex items-center justify-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] ' +
            (rest.fill ? 'absolute inset-0' : 'rounded-sm')
        }
        style={style}
      >
        <FileImage className="opacity-20" size={rest.fill ? 40 : 20} />
      </div>
    );
  }

  const resolved = typeof src === 'string' ? resolveImageSrc(src) : src;
  
  // NUCLEAR FIX: If the source contains /uploads/, it's a backend image.
  // We MUST skip Vercel optimization to avoid the 502/timeout errors.
  // We check the 'resolved' URL because older articles might only store the 
  // raw filename which resolveImageSrc then expands.
  const isBackendImage = typeof resolved === 'string' && resolved.includes('/uploads/');
  const shouldSkipOptimization = !!(unoptimized || isBackendImage);

  return (
    <Image 
      src={resolved} 
      alt={alt} 
      unoptimized={shouldSkipOptimization} 
      onError={() => {
        console.error('SafeImage failed to load:', resolved);
        setError(true);
      }}
      {...rest} 
    />
  );
}
