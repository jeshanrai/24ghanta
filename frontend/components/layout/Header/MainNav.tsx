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
                  'px-3 py-2 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-primary)] hover:text-[var(--color-primary)]'
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
