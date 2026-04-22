import Link from 'next/link';
import type { FooterColumn as FooterColumnType } from '@/lib/types';

interface FooterColumnProps {
  column: FooterColumnType;
}

export function FooterColumn({ column }: FooterColumnProps) {
  return (
    <div>
      <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wider text-white mb-2 md:mb-4">
        {column.title}
      </h3>
      <ul className="space-y-1.5 md:space-y-2">
        {column.links.map((link) => (
          <li key={link.id}>
            <Link
              href={link.href}
              className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
