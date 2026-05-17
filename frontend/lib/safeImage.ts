const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Backend stores admin-uploaded images as `/uploads/<file>`; resolve those
 *  to absolute URLs against the API origin. Other paths pass through. */
export function resolveImageSrc(src: string): string {
  if (!src) return '';
  // Block dangerous protocols
  if (/^(javascript|vbscript):/i.test(src.trim())) return '';

  // Clean the base API URL: remove trailing slash to avoid double slashes
  const base = API_ORIGIN.endsWith('/') ? API_ORIGIN.slice(0, -1) : API_ORIGIN;
  let resolved = src;

  // 1. If it's already a full URL
  if (src.startsWith('http') || src.startsWith('data:')) {
    resolved = src;
  } 
  // 2. If it's a relative path starting with /
  else if (src.startsWith('/')) {
    if (src.startsWith('/uploads/')) {
      resolved = `${base}${src}`;
    } else {
      resolved = src;
    }
  } 
  // 3. Fallback: treat as a raw storage key (legacy/compact format)
  else {
    resolved = `${base}/uploads/${src}`;
  }

  // 4. Mixed Content Fix: If the site is HTTPS, force the image to be HTTPS
  // This is critical for Vercel production environments.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && resolved.startsWith('http:')) {
    // Only force HTTPS if the URL belongs to our backend API
    const hostOnly = base.replace(/^https?:\/\//, '');
    if (resolved.includes(hostOnly)) {
      resolved = resolved.replace('http:', 'https:');
    }
  }

  return resolved;
}

export function isBackendImage(src: string): boolean {
  const resolved = resolveImageSrc(src);
  try {
    const apiHostname = new URL(API_ORIGIN).hostname;
    return new URL(resolved).hostname === apiHostname;
  } catch {
    return false;
  }
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
