'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { mainNavItems } from '@/lib/constants';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[var(--color-border)] shadow-lg z-50 animate-fade-in-down">
      <nav className="container py-4">
        <ul className="flex flex-col gap-1">
          {mainNavItems.map((item, idx) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li
                key={item.id}
                className="animate-fade-in-left"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'relative block px-4 py-3 text-base font-medium rounded overflow-hidden transition-all duration-300 ease-out',
                    'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--color-primary)] before:scale-y-0 before:transition-transform before:duration-300 before:ease-out hover:before:scale-y-100',
                    isActive
                      ? 'text-[var(--color-primary)] bg-[var(--color-surface)] before:scale-y-100'
                      : 'text-[var(--color-text-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:pl-5'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
