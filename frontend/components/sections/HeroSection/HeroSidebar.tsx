import type { Article } from '@/lib/types';
import type { Poll as PollType } from '@/lib/data/polls';
import { ArticleCardList } from '@/components/cards';
import { AdSlot } from '@/components/ads';
import { Poll } from '@/components/ui';

interface HeroSidebarProps {
  articles: Article[];
  activePoll?: PollType | null;
}

export function HeroSidebar({ articles, activePoll }: HeroSidebarProps) {
  if (articles.length === 0 && !activePoll) return null;

  return (
    <div>
      {activePoll && (
        <div className="mb-4 pb-4 border-b border-(--color-border) animate-fade-in-up stagger-1">
          <Poll poll={activePoll} compact />
        </div>
      )}
      {articles.length > 0 && (
        <div className="animate-fade-in-up stagger-2 space-y-2">
          {articles.slice(0, 4).map((article) => (
            <ArticleCardList key={article.id} article={article} titleClassName="text-sidebar-title" />
          ))}
        </div>
      )}
      <div className="mt-4 animate-fade-in-up stagger-3">
        <AdSlot placement="hero_sidebar" />
      </div>
    </div>
  );
}
