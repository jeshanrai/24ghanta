import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  children: ReactNode;
  label: string;
}

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

export function IconButton({
  size = 'md',
  children,
  label,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors duration-200',
        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
