'use client';

import { useEffect, useState } from 'react';
import { trendingTopics } from '@/lib/constants';
import { TrendingLink } from './TrendingLink';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Topic {
  id: string;
  label: string;
  href: string;
  badge: string | null;
}

const fallbackTopics: Topic[] = trendingTopics.map(t => ({ 
  id: t.id, 
  label: t.label, 
  href: t.href, 
  badge: t.badge ?? null 
}));

export function TrendingBar() {
  const [topics, setTopics] = useState<Topic[]>(fallbackTopics);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/trending`)
      .then(r => (r.ok ? r.json() : null))
      .then(payload => {
        if (cancelled) return;
        const items = payload?.data ?? [];
        if (items.length > 0) {
          setTopics(
            items.map((i: { id: number; label: string; href: string; badge: string | null }) => ({
              id: String(i.id),
              label: i.label,
              href: i.href,
              badge: i.badge,
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (topics.length === 0) return null;

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
