import Link from 'next/link';
import type { Article } from '@/lib/types';
import { ArticleCardList } from '@/components/cards';
import { OptimizedImage } from '@/components/ui';
import { AdSlot } from '@/components/ads';
import { cn, formatDate, formatReadTimeShort } from '@/lib/utils';

interface HeroSidebarProps {
  articles: Article[];
}

export function HeroSidebar({ articles }: HeroSidebarProps) {
  if (articles.length === 0) return null;

  const [topArticle, ...restArticles] = articles;

  return (
    <div>
      {topArticle && (
        <div className="animate-fade-in-up stagger-2">
          <article
            className="group"
            style={{ ['--hover-accent' as string]: topArticle.category.color || 'var(--color-primary)' }}
          >
            <Link href={`/article/${topArticle.slug}`} className="block">
              <div className="relative h-[220px] w-full overflow-hidden rounded-md shadow-sm group-hover:shadow-md transition-shadow duration-500">
                <OptimizedImage
                  src={topArticle.imageUrl}
                  alt={topArticle.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  objectFit="cover"
                  containerClassName="absolute inset-0"
                  className="transition-transform duration-[1000ms] group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-4">
                <h3 className={cn(
                  "font-headline text-sidebar-title text-[var(--color-text-primary)] group-hover:text-[var(--hover-accent)] transition-colors duration-300 line-clamp-3 leading-snug"
                )}>
                  {topArticle.title}
                </h3>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
                  <span>{formatDate(topArticle.publishedAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
                  <span>{formatReadTimeShort(topArticle.readTimeMinutes)}</span>
                </div>
              </div>
            </Link>
          </article>
        </div>
      )}
      {restArticles.length > 0 && (
        <div className="mt-4 animate-fade-in-up stagger-3 space-y-2">
          {restArticles.slice(0, 1).map((article) => (
            <ArticleCardList key={article.id} article={article} titleClassName="text-sidebar-title" />
          ))}
          <div className="py-4">
            <AdSlot
              placement="article_sidebar"
              aspectClassName="h-[112px] sm:h-[128px] lg:h-[140px]"
              className="shadow-sm rounded-md overflow-hidden bg-white w-full"
            />
          </div>
          {[restArticles[1], restArticles[3]].filter(Boolean).map((article) => (
            <ArticleCardList key={article.id} article={article} titleClassName="text-sidebar-title" />
          ))}
        </div>
      )}
    </div>
  );
}
