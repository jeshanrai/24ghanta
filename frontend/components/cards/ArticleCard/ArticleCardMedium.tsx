import Link from 'next/link';
import type { Article } from '@/lib/types';
import { cn, formatDate, formatReadTimeShort } from '@/lib/utils';
import { OptimizedImage, Badge } from '@/components/ui';

interface ArticleCardMediumProps {
  article: Article;
  showExcerpt?: boolean;
  showCategory?: boolean;
  titleClassName?: string;
}

export function ArticleCardMedium({
  article,
  showExcerpt = true,
  showCategory = true,
  titleClassName,
}: ArticleCardMediumProps) {
  return (
    <article
      className="group"
      style={{ ['--hover-accent' as string]: article.category.color || 'var(--color-primary)' }}
    >
      <Link href={`/article/${article.slug}`} className="block">
        <div className="shine-hover aspect-video relative overflow-hidden rounded-md shadow-sm group-hover:shadow-md transition-shadow duration-500">
          <OptimizedImage
            src={article.imageUrl}
            alt={article.imageAlt}
            fill
            containerClassName="w-full h-full relative"
            className="group-hover:scale-[1.06] transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
          {showCategory && (
            <div className="absolute top-3 left-3 z-10">
              <Badge color={article.category.color}>{article.category.name}</Badge>
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className={cn(
            "font-headline text-[var(--color-text-primary)] group-hover:text-[var(--hover-accent)] transition-colors duration-300 line-clamp-3 leading-snug",
            titleClassName || "text-card-title"
          )}>
            {article.title}
          </h3>
          {showExcerpt && article.excerpt && (
            <p className="mt-2 text-small text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
            <span>{formatDate(article.publishedAt)}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
            <span>{formatReadTimeShort(article.readTimeMinutes)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
