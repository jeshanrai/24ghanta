import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'primary' | 'breaking' | 'live';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  color?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
  primary: 'bg-[var(--color-primary)] text-white',
  breaking: 'bg-[var(--color-breaking)] text-white',
  live: 'bg-[var(--color-live)] text-white animate-pulse',
};

export function Badge({ variant = 'default', children, className, color }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        variantStyles[variant],
        className
      )}
      style={color ? { backgroundColor: color, color: 'white' } : undefined}
    >
      {children}
    </span>
  );
}
