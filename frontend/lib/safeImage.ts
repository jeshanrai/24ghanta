const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Backend stores admin-uploaded images as `/uploads/<file>`; resolve those
 *  to absolute URLs against the API origin. Other paths pass through. */
export function resolveImageSrc(src: string): string {
  if (!src) return '';

  // 1. If it's already a full URL
  if (src.startsWith('http') || src.startsWith('data:')) {
    // If the site is HTTPS, force the image to be HTTPS to avoid mobile blocking
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && src.startsWith('http:')) {
      return src.replace('http:', 'https:');
    }
    return src;
  }

  // 2. If it's a relative path starting with /
  if (src.startsWith('/')) {
    // If it's an upload path but missing the domain, add it
    if (src.startsWith('/uploads/')) {
      return `${API_ORIGIN}${src}`;
    }
    return src;
  }

  // 3. Fallback: treat as a raw storage key
  return `${API_ORIGIN}/uploads/${src}`;
}

export function isValidImageSrc(src: unknown): src is string | object {
  if (!src) return false;
  if (typeof src === 'object') return true; // Support StaticImport
  if (typeof src !== 'string') return false;
  
  const trimmed = src.trim();
  if (!trimmed) return false;
  
  // Next.js-friendly schemes / relative paths pass through.
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return true;
  }

  // Allow raw filenames/paths that don't have spaces (likely backend keys)
  if (!trimmed.includes(' ')) {
    return true;
  }

  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}
