import Link from 'next/link';
import type { Article } from '@/lib/types';
import { formatReadTimeShort } from '@/lib/utils';
import { ArticleImage, Badge, Poll } from '@/components/ui';
import type { Poll as PollType } from '@/lib/data/polls';

interface ArticleCardLargeProps {
  article: Article;
  priority?: boolean;
  activePoll?: PollType | null;
}

export function ArticleCardLarge({
  article,
  priority = false,
  activePoll,
}: ArticleCardLargeProps) {
  return (
    <article className="group">
      <Link href={`/article/${article.slug}`} className="block relative">
        <ArticleImage
          src={article.imageUrl}
          alt={article.imageAlt}
          priority={priority}
          overlay={true}
          aspectRatio={{ mobile: '16/10', desktop: '16/9' }}
          containerClassName="rounded-sm"
        />
        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6 z-20">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {article.isBreaking && (
              <div className="inline-flex items-center gap-2 animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75 animate-pulse-dot" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-breaking)]" />
                </span>
                <Badge variant="breaking">Breaking</Badge>
              </div>
            )}
            {article.category && (
              <Badge color={article.category.color || 'var(--color-primary)'} className="animate-fade-in-up">
                {article.category.name}
              </Badge>
            )}
          </div>
          <h2 className="font-headline text-h2 lg:text-h1 text-white line-clamp-3 transition-transform duration-500 ease-out group-hover:translate-y-[-2px]">
            {article.title}
          </h2>
          <div className="mt-2 text-xs text-white/80">
            {formatReadTimeShort(article.readTimeMinutes)}
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
