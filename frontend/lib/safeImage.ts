const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/** Backend stores admin-uploaded images as `/uploads/<file>`; resolve those
 *  to absolute URLs against the API origin. Other paths pass through. */
export function resolveImageSrc(src: string): string {
  if (src.startsWith('/uploads/')) return `${API_ORIGIN}${src}`;
  return src;
}

export function isValidImageSrc(src: unknown): src is string {
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
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}
