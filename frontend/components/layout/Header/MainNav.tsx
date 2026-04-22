'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { mainNavItems } from '@/lib/constants';

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center">
      <ul className="flex items-center gap-1">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  'nav-item relative inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-300 ease-out',
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
      </ul>
    </nav>
  );
}
