import Link from 'next/link';
import type { Article } from '@/lib/types';
import type { Poll as PollType } from '@/lib/data/polls';
import { HeroSlider } from './HeroSlider';
import { HeroSidebar } from './HeroSidebar';
import { Poll, OptimizedImage } from '@/components/ui';
import { formatDate, formatReadTimeShort } from '@/lib/utils';
import { Badge } from '@/components/ui';

interface HeroSectionProps {
  heroArticles: Article[];
  sidebarArticles: Article[];
  activePoll?: PollType | null;
  featuredArticle?: Article | null;
}

export function HeroSection({
  heroArticles,
  sidebarArticles,
  activePoll,
  featuredArticle,
}: HeroSectionProps) {
  return (
    <section className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-fade-in-up">
          <HeroSlider articles={heroArticles} />
          {activePoll && (
            <div className="mt-4 lg:hidden animate-fade-in-up">
              <Poll poll={activePoll} compact />
            </div>
          )}
        </div>
        <div className="max-lg:hidden lg:col-span-1 animate-fade-in-up stagger-2">
          <HeroSidebar articles={sidebarArticles} activePoll={activePoll} />
        </div>
      </div>

      {featuredArticle && (
        <div className="mt-6 pt-5 border-t border-(--color-border) animate-fade-in-up stagger-3">
          <Link
            href={`/article/${featuredArticle.slug}`}
            className="group flex gap-5 items-start"
          >
            <div className="shrink-0 w-52 sm:w-64 aspect-video relative overflow-hidden rounded-md shadow-sm group-hover:shadow-md transition-shadow duration-500">
              <OptimizedImage
                src={featuredArticle.imageUrl}
                alt={featuredArticle.imageAlt}
                fill
                containerClassName="w-full h-full relative"
                className="group-hover:scale-[1.06] transition-transform duration-700 ease-out"
              />
              <div className="absolute top-2 left-2 z-10">
                <Badge color={featuredArticle.category.color}>
                  {featuredArticle.category.name}
                </Badge>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-h2 text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-3 leading-snug">
                {featuredArticle.title}
              </h3>
              {featuredArticle.excerpt && (
                <p className="mt-2 text-small text-muted line-clamp-2 leading-relaxed">
                  {featuredArticle.excerpt}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-(--color-text-muted) font-medium">
                <span>{formatDate(featuredArticle.publishedAt)}</span>
                <span className="w-1 h-1 rounded-full bg-(--color-text-muted)" />
                <span>{formatReadTimeShort(featuredArticle.readTimeMinutes)}</span>
              </div>
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}
