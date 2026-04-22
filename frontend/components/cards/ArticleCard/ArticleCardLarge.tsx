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
        <div className="aspect-[16/10] lg:aspect-[16/9] relative overflow-hidden rounded-sm">
          <OptimizedImage
            src={article.imageUrl}
            alt={article.imageAlt}
            fill
            priority={priority}
            containerClassName="w-full h-full relative"
            className="group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
            {article.isBreaking && (
              <Badge variant="breaking" className="mb-3">
                Breaking
              </Badge>
            )}
            <h2 className="font-headline text-h1 lg:text-hero text-white line-clamp-3">
              {article.title}
            </h2>
            <div className="mt-2 text-xs text-white/80">
              {formatReadTimeShort(article.readTimeMinutes)}
            </div>
          </div>
        </div>
      </Link>

      {activePoll && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <Poll poll={activePoll} compact />
        </div>
      )}
    </article>
  );
}
