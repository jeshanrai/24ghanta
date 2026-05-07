import Link from 'next/link';
import type { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ArticleCardCompactProps {
  article: Article;
}

export function ArticleCardCompact({ article }: ArticleCardCompactProps) {
  return (
    <article className="py-3 border-b border-[var(--color-border-light)] last:border-b-0">
      <Link
        href={`/article/${article.slug}`}
        className="group block"
        style={{ ['--hover-accent' as string]: article.category.color || 'var(--color-primary)' }}
      >
        <h3 className="font-headline text-sidebar-title text-[var(--color-text-primary)] group-hover:text-[var(--hover-accent)] transition-colors duration-200 line-clamp-2">
          {article.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </Link>
    </article>
  );
}
