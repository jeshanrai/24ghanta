'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchIcon, CloseIcon } from '@/components/icons';
import { mockArticles } from '@/lib/data';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? mockArticles
        .filter((a) => {
          const haystack = `${a.title} ${a.excerpt ?? ''} ${a.category.name}`.toLowerCase();
          return haystack.includes(normalized);
        })
        .slice(0, 6)
    : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalized) return;
    router.push(`/search?q=${encodeURIComponent(normalized)}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white shadow-xl border-b border-[var(--color-border)] animate-fade-in-down">
        <div className="container py-4">
          <form onSubmit={submit} className="flex items-center gap-3">
            <SearchIcon size={22} className="text-[var(--color-text-muted)] shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, topics, categories..."
              className="flex-1 text-lg bg-transparent outline-none placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded hover:bg-[var(--color-surface)] transition-colors"
              aria-label="Close"
            >
              <CloseIcon size={18} />
            </button>
          </form>
        </div>

        {normalized && (
          <div className="container pb-4">
            {results.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-4">
                No matches for &quot;{query}&quot;. Press Enter to search anyway.
              </p>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] font-semibold mb-2">
                  Top matches
                </p>
                <ul className="divide-y divide-[var(--color-border-light)]">
                  {results.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/article/${a.slug}`}
                        onClick={onClose}
                        className="group flex items-start gap-3 py-3 px-2 -mx-2 rounded hover:bg-[var(--color-surface)] transition-colors"
                      >
                        <span
                          className="mt-1 inline-block w-1 h-4 rounded-sm shrink-0"
                          style={{ background: a.category.color || 'var(--color-primary)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                            {a.title}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {a.category.name}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-[var(--color-border-light)]">
                  <button
                    type="button"
                    onClick={submit}
                    className="text-sm text-[var(--color-primary)] font-semibold link-underline"
                  >
                    See all results for &quot;{query}&quot; →
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
