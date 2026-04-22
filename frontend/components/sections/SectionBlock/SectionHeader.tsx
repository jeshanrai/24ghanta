import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';

interface SectionHeaderProps {
  title: string;
  href?: string;
  color?: string;
}

export function SectionHeader({ title, href, color }: SectionHeaderProps) {
  const accent = color || 'var(--color-primary)';
  return (
    <div className="relative flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-border)]">
      <span
        className="absolute bottom-[-1px] left-0 h-[3px] w-24 animate-expand-x"
        style={{ background: accent }}
      />
      <h2 className="text-h1 font-bold text-[var(--color-text-primary)] flex items-center gap-3">
        <span
          className="inline-block h-6 w-1 rounded-full animate-fade-in-left"
          style={{ background: accent }}
          aria-hidden="true"
        />
        <span className="animate-fade-in-up">{title}</span>
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] link-underline"
        >
          See all
          <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
            <ChevronRightIcon size={16} />
          </span>
        </Link>
      )}
    </div>
  );
}
