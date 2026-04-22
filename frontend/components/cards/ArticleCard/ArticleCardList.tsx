import Link from 'next/link';
import type { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui';

interface ArticleCardListProps {
  article: Article;
  showImage?: boolean;
}

export function ArticleCardList({ article, showImage = true }: ArticleCardListProps) {
  return (
    <article className="py-4 border-b border-[var(--color-border-light)] last:border-b-0">
      <Link href={`/article/${article.slug}`} className="group flex gap-4">
        <div className="flex-1 min-w-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5">
          <h3 className="font-headline text-h3 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-300 line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)] line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>
        {showImage && (
          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-24 overflow-hidden rounded-sm">
            <OptimizedImage
              src={article.imageUrl}
              alt={article.imageAlt}
              fill
              containerClassName="w-full h-full relative"
              className="group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          </div>
        )}
      </Link>
    </article>
  );
}
