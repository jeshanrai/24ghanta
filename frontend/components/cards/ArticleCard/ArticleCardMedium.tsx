import Link from 'next/link';
import type { Article } from '@/lib/types';
import { formatDate, formatReadTimeShort } from '@/lib/utils';
import { OptimizedImage, Badge } from '@/components/ui';

interface ArticleCardMediumProps {
  article: Article;
  showExcerpt?: boolean;
  showCategory?: boolean;
}

export function ArticleCardMedium({
  article,
  showExcerpt = true,
  showCategory = true,
}: ArticleCardMediumProps) {
  return (
    <article className="group">
      <Link href={`/article/${article.slug}`} className="block">
        <div className="shine-hover aspect-video relative overflow-hidden rounded-sm">
          <OptimizedImage
            src={article.imageUrl}
            alt={article.imageAlt}
            fill
            containerClassName="w-full h-full relative"
            className="group-hover:scale-[1.06] transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        </div>
        <div className="mt-3">
          {showCategory && (
            <Badge color={article.category.color} className="mb-2">
              {article.category.name}
            </Badge>
          )}
          <h3 className="font-headline text-h2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-300 line-clamp-3">
            {article.title}
          </h3>
          {showExcerpt && article.excerpt && (
            <p className="mt-2 text-small text-[var(--color-text-secondary)] line-clamp-2">
              {article.excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <span>{formatDate(article.publishedAt)}</span>
            <span>•</span>
            <span>{formatReadTimeShort(article.readTimeMinutes)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
