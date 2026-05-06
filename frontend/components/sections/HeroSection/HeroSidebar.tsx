import type { Article } from '@/lib/types';
import type { Poll as PollType } from '@/lib/data/polls';
import { ArticleCardList, ArticleCardMedium } from '@/components/cards';
import { AdSlot } from '@/components/ads';
import { Poll } from '@/components/ui';

interface HeroSidebarProps {
  articles: Article[];
  activePoll?: PollType | null;
}

export function HeroSidebar({ articles, activePoll }: HeroSidebarProps) {
  if (articles.length === 0) return null;

  const [topArticle, ...restArticles] = articles;

  return (
    <div>
      {activePoll && (
        <div className="mb-4 pb-4 border-b border-(--color-border) animate-fade-in-up stagger-1">
          <Poll poll={activePoll} compact />
        </div>
      )}
      {topArticle && (
        <div className="animate-fade-in-up stagger-2">
          <ArticleCardMedium
            article={topArticle}
            showExcerpt={false}
            showCategory={false}
          />
        </div>
      )}
      {restArticles.length > 0 && (
        <div className="mt-4 animate-fade-in-up stagger-3 space-y-2">
          {restArticles.slice(0, 4).map((article) => (
            <ArticleCardList key={article.id} article={article} titleClassName="text-sidebar-title" />
          ))}
        </div>
      )}
      <div className="mt-4 animate-fade-in-up stagger-4">
        <AdSlot placement="hero_sidebar" />
      </div>
    </div>
  );
}
