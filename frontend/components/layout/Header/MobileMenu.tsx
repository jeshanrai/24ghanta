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
    <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-[var(--color-border)] shadow-lg z-50">
      <nav className="container py-4">
        <ul className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'block px-4 py-3 text-base font-medium transition-colors duration-200 rounded',
                    isActive
                      ? 'text-[var(--color-primary)] bg-[var(--color-surface)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
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
