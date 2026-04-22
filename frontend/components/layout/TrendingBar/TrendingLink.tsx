import Link from 'next/link';
import type { TrendingTopic } from '@/lib/types';

interface TrendingLinkProps {
  topic: TrendingTopic;
}

export function TrendingLink({ topic }: TrendingLinkProps) {
  return (
    <Link
      href={topic.href}
      className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-200 whitespace-nowrap"
    >
      {topic.label}
    </Link>
  );
}
