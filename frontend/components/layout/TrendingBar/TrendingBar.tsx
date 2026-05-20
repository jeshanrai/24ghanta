'use client';

import { useEffect, useState } from 'react';
import { TrendingLink } from './TrendingLink';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Topic {
  id: string;
  label: string;
  href: string;
  badge: string | null;
}

export function TrendingBar() {
  // Start empty so the bar stays hidden until the server confirms there are
  // items to show. Previously this fell back to a hardcoded constants list,
  // which made the deployed bar look stale when the admin hadn't populated
  // trending_items yet — empty is more honest than wrong.
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/trending`)
      .then(r => (r.ok ? r.json() : null))
      .then(payload => {
        if (cancelled) return;
        const items = payload?.data ?? [];
        const uniqueItems = items.filter((item: any, index: number, self: any[]) =>
          index === self.findIndex((t) => t.label === item.label)
        );
        setTopics(
          uniqueItems.map((i: { id: number; label: string; href: string; badge: string | null }) => ({
            id: String(i.id),
            label: i.label,
            href: i.href,
            badge: i.badge,
          }))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || topics.length === 0) return null;

  return (
    <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] animate-fade-in-down">
      <div className="container">
        <div className="flex items-center gap-4 py-2 overflow-hidden">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap bg-[var(--color-surface)] z-10 pr-4">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75 animate-pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            </span>
            Trending:
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="marquee-track">
              {/* Duplicate topics for seamless loop */}
              {[...topics, ...topics].map((topic, index) => (
                <div
                  key={`${topic.id}-${index}`}
                  className="flex items-center gap-4 px-2"
                >
                  <div className="flex items-center gap-1.5">
                    {topic.badge && (
                      <span className="px-1.5 py-0.5 rounded-sm bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
                        {topic.badge}
                      </span>
                    )}
                    <TrendingLink topic={{ id: topic.id, label: topic.label, href: topic.href }} />
                  </div>
                  <span className="text-[var(--color-border-dark)]">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
