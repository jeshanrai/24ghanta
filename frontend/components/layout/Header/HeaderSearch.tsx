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
    // ignore storage failures
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

export function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIdx(-1);
    inputRef.current?.blur();
  }, []);

  const goToSearch = useCallback((q: string) => {
    const v = q.trim();
    if (!v) return;
    persistQuery(v);
    router.push(`/search?q=${encodeURIComponent(v)}`);
    setQuery('');
    closeDropdown();
  }, [persistQuery, router, closeDropdown]);

  const goToArticle = useCallback((article: Article) => {
    if (trimmed) persistQuery(trimmed);
    router.push(`/article/${article.slug}`);
    setQuery('');
    closeDropdown();
  }, [trimmed, persistQuery, router, closeDropdown]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
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
      closeDropdown();
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

  const showResults = open && trimmed.length > 0;
  const showSuggestions = open && !trimmed;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={submit}>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
            open
              ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/15 bg-white'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-white hover:border-[var(--color-border-dark)]'
          }`}
        >
          <SearchIcon
            size={18}
            className={`shrink-0 transition-colors ${
              open || trimmed ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
            }`}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search articles, topics..."
            aria-label="Search"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="header-search-panel"
            aria-activedescendant={activeIdx >= 0 ? `header-search-result-${activeIdx}` : undefined}
            className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-[var(--color-text-muted)]"
          />
          {loading ? (
            <span
              className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin shrink-0"
              aria-hidden="true"
            />
          ) : trimmed ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border-light)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
              aria-label="Clear search"
            >
              <CloseIcon size={12} />
            </button>
          ) : (
            <kbd
              className="hidden xl:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] shrink-0"
              aria-hidden="true"
            >
              /
            </kbd>
          )}
        </div>
      </form>

      {open && (
        <div
          id="header-search-panel"
          role="listbox"
          className="absolute top-full mt-2 left-0 right-0 min-w-[360px] bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] overflow-hidden animate-fade-in-down z-50"
        >
          {showSuggestions && (
            <div className="p-4 space-y-4">
              {recent.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">
                      Recent
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => goToSearch(r)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[var(--color-surface)] hover:bg-[var(--color-border-light)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-2">
                  Trending topics
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {suggestionChips.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => goToSearch(t.label)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)] text-[var(--color-text-secondary)] transition-colors"
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                        {t.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}

          {showResults && (
            <div>
              {loading && results.length === 0 ? (
                <ul className="p-3 space-y-2" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex items-center gap-3 p-1">
                      <div className="w-10 h-10 rounded bg-[var(--color-surface)] animate-shimmer shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded bg-[var(--color-surface)] animate-shimmer w-3/4" />
                        <div className="h-2.5 rounded bg-[var(--color-surface)] animate-shimmer w-1/4" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    No matches for{' '}
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      &quot;{query}&quot;
                    </span>
                  </p>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goToSearch(query)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-[var(--color-primary)] hover:opacity-90 transition-opacity"
                  >
                    Search anyway
                    <span aria-hidden>→</span>
                  </button>
                </div>
              ) : (
                <>
                  <p className="px-4 pt-3 pb-1.5 text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">
                    Top matches
                  </p>
                  <ul>
                    {results.map((a, idx) => {
                      const active = idx === activeIdx;
                      return (
                        <li key={a.id}>
                          <Link
                            id={`header-search-result-${idx}`}
                            href={`/article/${a.slug}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              if (trimmed) persistQuery(trimmed);
                              setQuery('');
                              closeDropdown();
                            }}
                            onMouseEnter={() => setActiveIdx(idx)}
                            role="option"
                            aria-selected={active}
                            className={`group flex items-center gap-3 px-4 py-2.5 transition-colors ${
                              active ? 'bg-[var(--color-surface)]' : 'hover:bg-[var(--color-surface)]'
                            }`}
                          >
                            <span
                              className="w-1 self-stretch rounded-sm shrink-0"
                              style={{ background: a.category.color || 'var(--color-primary)' }}
                              aria-hidden
                            />
                            {a.imageUrl ? (
                              <span className="relative w-10 h-10 rounded overflow-hidden bg-[var(--color-surface)] shrink-0">
                                <Image
                                  src={a.imageUrl}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </span>
                            ) : (
                              <span className="w-10 h-10 rounded bg-[var(--color-surface)] shrink-0" aria-hidden />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                {highlight(a.title, trimmed)}
                              </p>
                              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5">
                                <span style={{ color: a.category.color || 'inherit' }} className="font-medium">
                                  {a.category.name}
                                </span>
                                {a.readTimeMinutes ? (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span>{a.readTimeMinutes} min</span>
                                  </>
                                ) : null}
                              </p>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-[var(--color-border-light)] px-4 py-2.5 flex items-center justify-between bg-[var(--color-surface)]/50">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToSearch(query)}
                      className="text-xs text-[var(--color-primary)] font-semibold link-underline"
                    >
                      See all results →
                    </button>
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <kbd className="font-mono px-1 py-0.5 rounded border border-[var(--color-border)] bg-white">↑↓</kbd>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <kbd className="font-mono px-1 py-0.5 rounded border border-[var(--color-border)] bg-white">↵</kbd>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <kbd className="font-mono px-1 py-0.5 rounded border border-[var(--color-border)] bg-white">esc</kbd>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
