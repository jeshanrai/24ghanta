'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchIcon, CloseIcon } from '@/components/icons';
import { trendingTopics } from '@/lib/constants';
import type { Article } from '@/lib/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const RECENT_KEY = '24ghanta:recent-searches';
const RECENT_LIMIT = 6;

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

function loadRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

function highlight(text: string, q: string) {
  const query = q.trim();
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[var(--color-primary)]/15 text-[var(--color-primary)] rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const trimmed = query.trim();

  const suggestionChips = useMemo(
    () =>
      trendingTopics
        .filter(t => t.label && t.label !== 'Breaking News')
        .slice(0, 6),
    []
  );

  const persistQuery = useCallback((q: string) => {
    const next = [q, ...recent.filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_LIMIT);
    setRecent(next);
    saveRecent(next);
  }, [recent]);

  const goToSearch = useCallback((q: string) => {
    const v = q.trim();
    if (!v) return;
    persistQuery(v);
    router.push(`/search?q=${encodeURIComponent(v)}`);
    onClose();
  }, [persistQuery, router, onClose]);

  const goToArticle = useCallback((article: Article) => {
    if (trimmed) persistQuery(trimmed);
    router.push(`/article/${article.slug}`);
    onClose();
  }, [trimmed, persistQuery, router, onClose]);

  useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setActiveIdx(-1);
    }
  }, [open]);

  useEffect(() => {
    setActiveIdx(-1);
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/api/articles/search?q=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('search failed');
        const data = await res.json();
        setResults(data?.data ?? []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(debounce);
    };
  }, [trimmed]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      goToArticle(results[activeIdx]);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearch(query);
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-white shadow-2xl border-b border-[var(--color-border)] animate-fade-in-down">
        <div className="container py-5 lg:py-6">
          <form onSubmit={submit} className="flex items-center gap-3">
            <div className="group/searchbar flex items-center gap-3 flex-1 px-5 py-3.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-dark)] focus-within:bg-white focus-within:border-[var(--color-primary)] focus-within:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] focus-within:ring-4 focus-within:ring-[var(--color-primary)]/10 transition-all duration-200">
              <SearchIcon
                size={22}
                className={`shrink-0 transition-colors ${
                  trimmed ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                }`}
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, topics, categories..."
                aria-label="Search query"
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-activedescendant={activeIdx >= 0 ? `search-result-${activeIdx}` : undefined}
                className="flex-1 text-base lg:text-lg bg-transparent outline-none placeholder:text-[var(--color-text-muted)]"
              />
              {loading && (
                <span
                  className="w-4 h-4 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin shrink-0"
                  aria-hidden="true"
                />
              )}
              {!loading && trimmed && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
                  aria-label="Clear search"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Close"
            >
              <span>Close</span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                Esc
              </kbd>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden p-2 rounded hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-muted)]"
              aria-label="Close"
            >
              <CloseIcon size={18} />
            </button>
          </form>
        </div>

        <div id="search-results" className="container pb-5">
          {!trimmed ? (
            <div className="space-y-5 animate-fade-in">
              {recent.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-bold">
                      Recent searches
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          onClick={() => goToSearch(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[var(--color-surface)] hover:bg-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {r}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-2">
                  Trending topics
                </p>
                <ul className="flex flex-wrap gap-2">
                  {suggestionChips.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => goToSearch(t.label)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)] text-[var(--color-text-secondary)] transition-colors"
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                        {t.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : loading && results.length === 0 ? (
            <ul className="space-y-2 animate-fade-in" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded bg-[var(--color-surface)] animate-shimmer shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 rounded bg-[var(--color-surface)] animate-shimmer w-3/4" />
                    <div className="h-2.5 rounded bg-[var(--color-surface)] animate-shimmer w-1/4" />
                  </div>
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <div className="py-6 text-center animate-fade-in">
              <p className="text-sm text-[var(--color-text-secondary)]">
                No matches for{' '}
                <span className="font-semibold text-[var(--color-text-primary)]">
                  &quot;{query}&quot;
                </span>
              </p>
              <button
                type="button"
                onClick={submit}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
              >
                Search anyway
                <span aria-hidden>→</span>
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-2">
                Top matches
              </p>
              <ul className="divide-y divide-[var(--color-border-light)]" role="listbox">
                {results.map((a, idx) => {
                  const active = idx === activeIdx;
                  return (
                    <li key={a.id}>
                      <Link
                        id={`search-result-${idx}`}
                        href={`/article/${a.slug}`}
                        onClick={() => {
                          if (trimmed) persistQuery(trimmed);
                          onClose();
                        }}
                        onMouseEnter={() => setActiveIdx(idx)}
                        role="option"
                        aria-selected={active}
                        className={`group flex items-center gap-3 py-2.5 px-2 -mx-2 rounded transition-colors ${
                          active ? 'bg-[var(--color-surface)]' : 'hover:bg-[var(--color-surface)]'
                        }`}
                      >
                        <span
                          className="w-1 self-stretch rounded-sm shrink-0"
                          style={{ background: a.category.color || 'var(--color-primary)' }}
                          aria-hidden
                        />
                        {a.imageUrl ? (
                          <span className="relative w-12 h-12 rounded overflow-hidden bg-[var(--color-surface)] shrink-0">
                            <Image
                              src={a.imageUrl}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </span>
                        ) : (
                          <span className="w-12 h-12 rounded bg-[var(--color-surface)] shrink-0" aria-hidden />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                            {highlight(a.title, trimmed)}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                            <span style={{ color: a.category.color || 'inherit' }} className="font-medium">
                              {a.category.name}
                            </span>
                            {a.readTimeMinutes ? (
                              <>
                                <span aria-hidden>·</span>
                                <span>{a.readTimeMinutes} min read</span>
                              </>
                            ) : null}
                          </p>
                        </div>
                        <span
                          className={`text-[var(--color-primary)] shrink-0 transition-transform ${
                            active ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                          }`}
                          aria-hidden
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 pt-3 border-t border-[var(--color-border-light)] flex items-center justify-between">
                <button
                  type="button"
                  onClick={submit}
                  className="text-sm text-[var(--color-primary)] font-semibold link-underline"
                >
                  See all results for &quot;{query}&quot; →
                </button>
                <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <kbd className="font-mono px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">↑</kbd>
                    <kbd className="font-mono px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">↓</kbd>
                    navigate
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <kbd className="font-mono px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">↵</kbd>
                    open
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
