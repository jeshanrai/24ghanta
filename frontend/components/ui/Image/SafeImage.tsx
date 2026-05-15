"use client";

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { FileImage } from 'lucide-react';
import { isValidImageSrc, resolveImageSrc, isBackendImage } from '@/lib/safeImage';

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
  const [useUnoptimized, setUseUnoptimized] = useState(false);
  const resolved = typeof src === 'string' ? resolveImageSrc(src) : src;
  // vercel optimization lai choddine. images already .webp so farak pardaina.
  const isBackend = typeof src === 'string' && isBackendImage(src);

  if (!isValidImageSrc(src) || error) {
    const style =
      !rest.fill && (rest.width || rest.height)
        ? { width: rest.width as number | undefined, height: rest.height as number | undefined }
        : undefined;
    return (
      <div
        aria-label={alt}
        className={
          (fallbackClassName ||
          'flex flex-col items-center justify-center bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] ') +
            (rest.fill ? 'absolute inset-0 p-4' : 'rounded-sm p-2')
        }
        style={style}
      >
        <FileImage className="opacity-20 mb-1" size={rest.fill ? 40 : 20} />
      </div>
    );
  }

  return (
    <Image 
      src={resolved} 
      alt={alt} 
      unoptimized={unoptimized || useUnoptimized || isBackend}
      onError={() => {
        if (!useUnoptimized) {
          setUseUnoptimized(true);
        } else {
          console.error('SafeImage failed to load:', resolved);
          setError(true);
        }
      }}
      {...rest} 
    />
  );
}
