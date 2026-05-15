import Link from 'next/link';
import type { Article } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { ArticleImage } from '@/components/ui';

interface ArticleCardListProps {
  article: Article;
  showImage?: boolean;
  titleClassName?: string;
}

export function ArticleCardList({ article, showImage = true, titleClassName }: ArticleCardListProps) {
  return (
    <article className="py-4 border-b border-[var(--color-border-light)] last:border-b-0">
      <Link
        href={`/article/${article.slug}`}
        className="group flex gap-4 transition-transform duration-300 ease-out hover:translate-x-0.5"
        style={{ ['--hover-accent' as string]: article.category.color || 'var(--color-primary)' }}
      >
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-headline text-[var(--color-text-primary)] group-hover:text-[var(--hover-accent)] transition-colors duration-300 line-clamp-2 leading-snug",
            titleClassName || "text-card-title"
          )}>
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="mt-1.5 text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>
        {showImage && (
          <div className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-24">
            <ArticleImage
              src={article.imageUrl}
              alt={article.imageAlt}
              aspectRatio="1/1"
              containerClassName="rounded-md shadow-sm"
              sizes="(min-width: 640px) 112px, 80px"
            />
          </div>
        )}
      </Link>
    </article>
  );
}
