import Image, { ImageProps } from 'next/image';
import { isValidImageSrc, resolveImageSrc } from '@/lib/safeImage';

type SafeImageProps = ImageProps & {
  fallbackClassName?: string;
};

/**
 * Drop-in replacement for next/image that renders a graceful fallback
 * (instead of crashing) when the `src` is missing/empty/malformed.
 * Safe to use in both server and client components.
 */
export function SafeImage({ src, alt, fallbackClassName, ...rest }: SafeImageProps) {
  if (!isValidImageSrc(src)) {
    const style =
      !rest.fill && (rest.width || rest.height)
        ? { width: rest.width as number | undefined, height: rest.height as number | undefined }
        : undefined;
    return (
      <div
        aria-label={alt}
        className={
          fallbackClassName ||
          'flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-muted)] text-xs ' +
            (rest.fill ? 'absolute inset-0' : 'rounded-sm')
        }
        style={style}
      >
        <span>Image not available</span>
      </div>
    );
  }
  const resolved = typeof src === 'string' ? resolveImageSrc(src) : src;
  return <Image src={resolved} alt={alt} {...rest} />;
}
