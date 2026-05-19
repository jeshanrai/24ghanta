'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Reads `?adPreview=<placement>` from the URL (set by the admin "View on site"
 * button) and scrolls to the first matching ad slot, with a brief highlight
 * ring so the admin can spot which one. No-op if the param is absent or no
 * matching slot is on the page.
 *
 * Lives in the root layout so it works on every public route.
 */
export function AdPreviewScroller() {
  const pathname = usePathname();
  const params = useSearchParams();
  const placement = params.get('adPreview');

  useEffect(() => {
    if (!placement) return;
    // Wait one frame for AdSlots (server components) to be in the DOM.
    let cancelled = false;
    const tryScroll = (attempt = 0) => {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(
        `[data-ad-placement="${CSS.escape(placement)}"]`
      );
      if (!el && attempt < 10) {
        setTimeout(() => tryScroll(attempt + 1), 150);
        return;
      }
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add(
        'ring-4',
        'ring-amber-400',
        'ring-offset-2',
        'transition-shadow',
        'duration-500'
      );
      const off = setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2');
      }, 2400);
      // Capture for cleanup
      (el as any).__adPreviewTimer = off;
    };
    tryScroll();
    return () => {
      cancelled = true;
    };
  }, [placement, pathname]);

  return null;
}
