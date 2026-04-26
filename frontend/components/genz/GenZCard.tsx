'use client';

import Link from 'next/link';
import { SafeImage as Image } from '@/components/ui';
import { ReactionBar } from './ReactionBar';
import { formatDate } from '@/lib/utils';

interface GenZArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  imageUrl: string;
  imageAlt: string;
  publishedAt: string;
  readTimeMinutes: number;
  category: {
    name: string;
    slug: string;
  };
  reactions?: {
    fire?: number;
    laugh?: number;
    wow?: number;
    hundred?: number;
    heart?: number;
  };
}

interface GenZCardProps {
  article: GenZArticle;
  colorIndex?: number;
}

const accentColors = [
  { bg: 'bg-[#FF6B6B]', text: 'text-black', glow: 'hover:shadow-[0_0_30px_rgba(255,107,107,0.3)]' },
  { bg: 'bg-[#4ECDC4]', text: 'text-black', glow: 'hover:shadow-[0_0_30px_rgba(78,205,196,0.3)]' },
  { bg: 'bg-[#FFE66D]', text: 'text-black', glow: 'hover:shadow-[0_0_30px_rgba(255,230,109,0.3)]' },
  { bg: 'bg-[#AA96DA]', text: 'text-black', glow: 'hover:shadow-[0_0_30px_rgba(170,150,218,0.3)]' },
  { bg: 'bg-[#F38181]', text: 'text-black', glow: 'hover:shadow-[0_0_30px_rgba(243,129,129,0.3)]' },
  { bg: 'bg-[#95E1D3]', text: 'text-black', glow: 'hover:shadow-[0_0_30px_rgba(149,225,211,0.3)]' },
];

export function GenZCard({ article, colorIndex = 0 }: GenZCardProps) {
  const color = accentColors[colorIndex % accentColors.length];

  return (
    <article className={`
      group relative
      bg-[var(--genz-surface)] rounded-2xl overflow-hidden
      transition-all duration-300 ease-out
      hover:translate-y-[-8px] ${color.glow}
    `}>
      <Link href={`/article/${article.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={article.imageUrl}
            alt={article.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className={`
              ${color.bg} ${color.text}
              px-3 py-1 rounded-full
              text-xs font-bold uppercase tracking-wide
            `}>
              {article.category.name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-lg font-bold text-[var(--genz-text)] leading-tight mb-2 line-clamp-2 group-hover:text-[var(--genz-coral)] transition-colors">
            {article.title}
          </h3>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-[var(--genz-text-muted)] line-clamp-2 mb-3">
              {article.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-[var(--genz-text-dim)] mb-3">
            <span>{formatDate(article.publishedAt)}</span>
            <span>•</span>
            <span>{article.readTimeMinutes} min read</span>
          </div>
        </div>
      </Link>

      {/* Reactions - outside of link */}
      <div className="px-4 pb-4 pt-0">
        <ReactionBar initialReactions={article.reactions} size="sm" />
      </div>
    </article>
  );
}
