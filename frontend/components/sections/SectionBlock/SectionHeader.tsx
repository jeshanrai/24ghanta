import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';

interface SectionHeaderProps {
  title: string;
  href?: string;
  color?: string;
}

export function SectionHeader({ title, href, color }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4 pb-2 border-b-2" style={{ borderColor: color || 'var(--color-primary)' }}>
      <h2 className="text-h1 font-bold text-[var(--color-text-primary)]">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          See all
          <ChevronRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}
