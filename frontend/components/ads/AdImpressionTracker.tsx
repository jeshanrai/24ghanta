'use client';

import { useEffect, useRef } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function AdImpressionTracker({ adId }: { adId: string }) {
  const fired = useRef(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (fired.current) return;
    const node = ref.current;
    if (!node) return;

    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      // Fire-and-forget — non-blocking, no auth.
      fetch(`${API}/api/ads/${adId}/impression`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => {});
    };

    if (typeof IntersectionObserver === 'undefined') {
      fire();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            fire();
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [adId]);

  return <span ref={ref} aria-hidden="true" className="sr-only" />;
}
