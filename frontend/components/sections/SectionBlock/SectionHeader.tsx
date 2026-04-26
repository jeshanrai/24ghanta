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
    <div className="relative flex items-end justify-between mb-6 pb-3 border-b-2 border-[var(--color-border)]">
      <span
        className="absolute bottom-[-2px] left-0 h-[3px] w-32 animate-expand-x"
        style={{ background: accent }}
      />
      <h2 className="text-h1 font-bold text-[var(--color-text-primary)] flex items-center gap-3 tracking-tight">
        <span
          className="inline-block h-7 w-1.5 rounded-sm animate-fade-in-left"
          style={{ background: accent }}
          aria-hidden="true"
        />
        <span className="animate-fade-in-up uppercase">{title}</span>
      </h2>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-200"
        >
          See all
          <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
            <ChevronRightIcon size={14} />
          </span>
        </Link>
      )}
    </div>
  );
}
