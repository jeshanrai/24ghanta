'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/types/article';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';

interface CategoryDropdownProps {
  categories: Category[];
  currentSlug: string;
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
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
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
          {categories.map((c) => {
            const isActive = c.slug === currentSlug;
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                onClick={() => setOpen(false)}
                role="option"
                aria-selected={isActive}
                className={`flex items-center gap-3 p-3 hover:bg-[var(--color-surface)] transition-colors group ${
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
