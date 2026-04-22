import Link from 'next/link';
import type { Article } from '@/lib/types';
import { formatReadTimeShort } from '@/lib/utils';
import { OptimizedImage, Badge, Poll } from '@/components/ui';
import { getActivePoll } from '@/lib/data/polls';

interface ArticleCardLargeProps {
  article: Article;
  priority?: boolean;
}

export function ArticleCardLarge({
  article,
  priority = false,
}: ArticleCardLargeProps) {
  const activePoll = getActivePoll();
  return (
    <article className="group">
      <Link href={`/article/${article.slug}`} className="block relative">
        <div className="shine-hover aspect-[16/10] lg:aspect-[16/9] relative overflow-hidden rounded-sm">
          <OptimizedImage
            src={article.imageUrl}
            alt={article.imageAlt}
            fill
            priority={priority}
            containerClassName="w-full h-full relative"
            className="group-hover:scale-[1.06] transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-300 group-hover:from-black/90" />
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
            {article.isBreaking && (
              <div className="mb-3 inline-flex items-center gap-2 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75 animate-pulse-dot" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-breaking)]" />
                </span>
                <Badge variant="breaking">Breaking</Badge>
              </div>
            )}
            <h2 className="font-headline text-h1 lg:text-hero text-white line-clamp-3 transition-transform duration-500 ease-out group-hover:translate-y-[-2px]">
              {article.title}
            </h2>
            <div className="mt-2 text-xs text-white/80">
              {formatReadTimeShort(article.readTimeMinutes)}
            </div>
          </div>
        </div>
      </Link>

      {activePoll && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] animate-fade-in-up stagger-3">
          <Poll poll={activePoll} compact />
        </div>
      )}
    </article>
  );
}
