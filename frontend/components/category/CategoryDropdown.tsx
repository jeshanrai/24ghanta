'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/types/article';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';

interface CategoryDropdownProps {
  categories: Category[];
  currentSlug: string;
}

/**
 * Walks the parent_id tree and emits a depth-first list with depth annotations
 * so the dropdown can indent subcategories under their parent.
 */
function sortByTree(categories: Category[]): { category: Category; depth: number }[] {
  const byParent = new Map<string | null, Category[]>();
  for (const c of categories) {
    const key = c.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }
  for (const list of byParent.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  const out: { category: Category; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const c of byParent.get(parentId) || []) {
      out.push({ category: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  // Orphans (parent missing/deleted): append at end as roots.
  const seen = new Set(out.map((o) => o.category.id));
  for (const c of categories) {
    if (!seen.has(c.id)) out.push({ category: c, depth: 0 });
  }
  return out;
}

export function CategoryDropdown({ categories, currentSlug }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = categories.find((c) => c.slug === currentSlug);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--color-border,rgba(0,0,0,0.1))] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover,var(--color-surface))] transition-colors"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: current?.color || 'var(--color-primary)' }}
          />
          <span className="font-bold text-[var(--color-primary)] truncate">
            {current?.name ?? 'Select Category'}
          </span>
        </span>
        <ChevronDownIcon
          size={18}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-2 w-full max-h-80 overflow-y-auto rounded-lg border border-[var(--color-border,rgba(0,0,0,0.1))] bg-[var(--color-bg,#fff)] shadow-lg"
        >
          {sortByTree(categories).map(({ category: c, depth }) => {
            const isActive = c.slug === currentSlug;
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                onClick={() => setOpen(false)}
                role="option"
                aria-selected={isActive}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                className={`flex items-center gap-3 py-3 pr-3 hover:bg-[var(--color-surface)] transition-colors group ${
                  isActive ? 'bg-[var(--color-surface)] font-bold' : ''
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c.color || 'var(--color-primary)' }}
                />
                <span
                  className={`transition-colors ${
                    isActive
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]'
                  }`}
                >
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
