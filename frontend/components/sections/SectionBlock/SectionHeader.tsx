import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';

interface SectionHeaderProps {
  title: string;
  href?: string;
  color?: string;
  /** Small uppercase label above the title (e.g. "Latest from"). */
  kicker?: string;
  /** Layout style — keeps each section visually distinct on the home page. */
  style?: 'bar' | 'tag' | 'underline';
}

export function SectionHeader({
  title,
  href,
  color,
  kicker,
  style = 'bar',
}: SectionHeaderProps) {
  const accent = color || 'var(--color-primary)';

  if (style === 'tag') {
    return (
      <div className="flex items-center justify-between gap-4 mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-[0.18em] text-white shadow-sm"
            style={{ background: accent }}
          >
            {title}
          </span>
          {kicker && (
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-medium hidden sm:inline">
              {kicker}
            </span>
          )}
        </div>
        {href && <SeeAllLink href={href} />}
      </div>
    );
  }

  if (style === 'underline') {
    return (
      <div className="mb-6 animate-fade-in-up">
        <div className="flex items-end justify-between gap-4">
          <div>
            {kicker && (
              <p
                className="text-[11px] font-bold uppercase tracking-[0.22em] mb-1"
                style={{ color: accent }}
              >
                {kicker}
              </p>
            )}
            <h2 className="font-headline text-h1 font-bold text-[var(--color-text-primary)] tracking-tight uppercase">
              {title}
            </h2>
          </div>
          {href && <SeeAllLink href={href} />}
        </div>
        <div
          className="mt-3 h-[3px] w-16 rounded-full animate-expand-x"
          style={{ background: accent }}
        />
      </div>
    );
  }

  // Default: 'bar' style
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
      {href && <SeeAllLink href={href} />}
    </div>
  );
}

function SeeAllLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors duration-200 shrink-0"
    >
      See all
      <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
        <ChevronRightIcon size={14} />
      </span>
    </Link>
  );
}
