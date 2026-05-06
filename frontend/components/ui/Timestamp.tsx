import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TimestampProps {
  date: string | Date;
  className?: string;
  showIcon?: boolean;
}

export function Timestamp({ date, className, showIcon = false }: TimestampProps) {
  return (
    <span className={cn('font-mono text-[11px] font-medium text-[var(--color-text-muted)]', className)}>
      {showIcon && (
        <svg
          className="mr-1.5 inline-block h-3 w-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {formatDate(date)}
    </span>
  );
}
