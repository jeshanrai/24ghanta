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
  
  // Skip Vercel optimization for backend images to avoid 502 errors.
  // We check if it starts with /uploads/ OR if it contains our API URL.
  const isBackendImage = 
    typeof src === 'string' && 
    (src.startsWith('/uploads/') || (process.env.NEXT_PUBLIC_API_URL && src.includes(process.env.NEXT_PUBLIC_API_URL)));
  
  const shouldSkipOptimization = unoptimized || isBackendImage;

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
