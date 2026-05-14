'use client';

import { cn } from '@/lib/utils';
import { OptimizedImage } from './OptimizedImage';
import { CSSProperties } from 'react';

interface AspectRatio {
  mobile: string;
  desktop?: string;
}

interface FocalPoint {
  x: number; // 0-100
  y: number; // 0-100
}

interface ArticleImageProps {
  src: string;
  alt: string;
  aspectRatio?: string | AspectRatio;
  focalPoint?: FocalPoint;
  overlay?: boolean | 'strong' | 'subtle';
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  objectFit?: 'cover' | 'contain';
  /**
   * Prevents aggressive cropping by ensuring the image is fully visible
   * within the aspect ratio container, using letterboxing if necessary.
   */
  preserveVisualArea?: boolean;
}

/**
 * ArticleImage provides professional, responsive image handling for news/blog content.
 * Features include responsive aspect ratios, focal point preservation, scrims for text readability,
 * and performance optimizations.
 */
export function ArticleImage({
  src,
  alt,
  aspectRatio = { mobile: '16/10', desktop: '16/9' },
  focalPoint,
  overlay = false,
  priority = false,
  className,
  containerClassName,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',
  objectFit = 'cover',
  preserveVisualArea = false,
}: ArticleImageProps) {
  
  // Resolve aspect ratios
  const mobileAR = typeof aspectRatio === 'string' ? aspectRatio : aspectRatio.mobile;
  const desktopAR = typeof aspectRatio === 'string' ? aspectRatio : (aspectRatio.desktop || aspectRatio.mobile);

  // Focal point style
  const imageStyle: CSSProperties = focalPoint 
    ? { objectPosition: `${focalPoint.x}% ${focalPoint.y}%` } 
    : {};

  // If preserveVisualArea is true, we might want to use contain instead of cover
  const resolvedObjectFit = preserveVisualArea ? 'contain' : objectFit;

  // Overlay classes (Scrims)
  const overlayClasses = cn(
    "absolute inset-0 transition-opacity duration-300 pointer-events-none z-10",
    overlay === 'subtle' && "bg-gradient-to-t from-black/40 via-transparent to-transparent",
    overlay === true && "bg-gradient-to-t from-black/80 via-black/20 to-transparent",
    overlay === 'strong' && "bg-gradient-to-t from-black/95 via-black/40 to-transparent",
  );

  // Unique identifier for the instance to scope the style tag
  const instanceId = `ar-${src.split('/').pop()?.split('.')[0] || Math.random().toString(36).substring(7)}`;

  return (
    <div 
      className={cn(
        "relative overflow-hidden group/article-image rounded-sm bg-[var(--color-surface-hover)]",
        instanceId,
        containerClassName
      )}
      style={{
        aspectRatio: mobileAR,
        maxHeight: 'min(70vh, 800px)', // Prevent images from being too tall on large screens
      } as any}
    >
      {/* Desktop Aspect Ratio Support - Scoped by instanceId */}
      <style>{`
        @media (min-width: 1024px) {
          .${instanceId} {
            aspect-ratio: ${desktopAR} !important;
          }
        }
      `}</style>

      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        objectFit={resolvedObjectFit}
        containerClassName="absolute inset-0"
        className={cn(
          "transition-transform duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) group-hover/article-image:scale-[1.03]",
          className
        )}
        style={imageStyle}
      />
      
      {overlay && (
        <div className={overlayClasses} />
      )}
      
      {/* Safe Area support: Subtle overlay that appears on hover or can be fixed */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/article-image:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
      
      {/* Glass-like border highlight */}
      <div className="absolute inset-0 border border-white/10 opacity-0 group-hover/article-image:opacity-100 transition-opacity duration-500 pointer-events-none z-20" />
    </div>
  );
}
