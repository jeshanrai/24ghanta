import type { ReactNode } from 'react';
import { SectionHeader } from './SectionHeader';

interface SectionBlockProps {
  title: string;
  href?: string;
  color?: string;
  children: ReactNode;
  className?: string;
}

export function SectionBlock({ title, href, color, children, className }: SectionBlockProps) {
  return (
    <section className={className}>
      <SectionHeader title={title} href={href} color={color} />
      <div className="animate-fade-in-up stagger-1">{children}</div>
    </section>
  );
}
