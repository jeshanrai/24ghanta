import { formatDuration } from '@/lib/utils';

interface DurationBadgeProps {
  seconds: number;
}

export function DurationBadge({ seconds }: DurationBadgeProps) {
  return (
    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
      {formatDuration(seconds)}
    </span>
  );
}
