import type { ReactNode } from 'react';
import { SectionHeader } from './SectionHeader';

interface SectionBlockProps {
  title: string;
  href?: string;
  color?: string;
  kicker?: string;
  headerStyle?: 'bar' | 'tag' | 'underline';
  /** Optional very-subtle tinted background that picks up the accent color. */
  tinted?: boolean;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({
  title,
  href,
  color,
  kicker,
  headerStyle = 'bar',
  tinted = false,
  children,
  className,
}: SectionBlockProps) {
  const accent = color || 'var(--color-primary)';

  if (tinted) {
    return (
      <section
        className={`relative -mx-4 sm:-mx-6 lg:-mx-[1.875rem] xl:-mx-[2.375rem] px-4 sm:px-6 lg:px-[1.875rem] xl:px-[2.375rem] py-8 lg:py-10 rounded-md ${className || ''}`}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 5%, transparent) 0%, transparent 100%)`,
        }}
      >
        <SectionHeader
          title={title}
          href={href}
          color={color}
          kicker={kicker}
          style={headerStyle}
        />
        <div className="animate-fade-in-up stagger-1">{children}</div>
      </section>
    );
  }

  return (
    <section className={className}>
      <SectionHeader
        title={title}
        href={href}
        color={color}
        kicker={kicker}
        style={headerStyle}
      />
      <div className="animate-fade-in-up stagger-1">{children}</div>
    </section>
  );
}
