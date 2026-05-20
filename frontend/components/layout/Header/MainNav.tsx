'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavCategories } from './useNavCategories';

// Inline cap for the desktop bar. Anything past this slips into the "More"
// dropdown so the header never wraps. Matches the original 9-item layout
// (World → Lifestyle), and admins can reorder/hide via nav_order +
// show_in_nav on /admin/categories.
const VISIBLE_CAP = 9;

export function MainNav() {
  const pathname = usePathname();
  const items = useNavCategories();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement | null>(null);

  // Close the More dropdown when the user clicks outside or hits Escape.
  useEffect(() => {
    if (!moreOpen) return;
    function onDocClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMoreOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  // Close on route change so the dropdown doesn't linger after navigation.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const visible = items.slice(0, VISIBLE_CAP);
  const overflow = items.slice(VISIBLE_CAP);

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const overflowActive = overflow.some((i) => isItemActive(i.href));

  return (
    <nav className="hidden lg:flex items-center">
      <ul className="flex items-center gap-1">
        {visible.map((item) => {
          const isActive = isItemActive(item.href);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  'nav-item relative inline-flex items-center whitespace-nowrap px-3 py-2 text-[16px] font-semibold transition-all duration-300 ease-out',
                  isActive
                    ? 'text-[var(--color-primary)] nav-item--active'
                    : 'text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:-translate-y-0.5'
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}

        {overflow.length > 0 && (
          <li ref={moreRef} className="relative">
            <button
              type="button"
              aria-label={moreOpen ? 'Hide more categories' : 'Show more categories'}
              onClick={() => setMoreOpen((v) => !v)}
              className={cn(
                'nav-item relative inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-[16px] font-semibold transition-all duration-300 ease-out',
                overflowActive
                  ? 'text-[var(--color-primary)] nav-item--active'
                  : 'text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:-translate-y-0.5'
              )}
            >
              More
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  moreOpen && 'rotate-180'
                )}
              />
            </button>
            {moreOpen && (
              <div className="absolute right-0 mt-1 min-w-[12rem] bg-white border border-[var(--color-border)] rounded-md shadow-lg py-1 z-50 animate-fade-in-down">
                {overflow.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        'block whitespace-nowrap px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'text-[var(--color-primary)] font-semibold bg-[var(--color-surface)]'
                          : 'text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)]'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}
