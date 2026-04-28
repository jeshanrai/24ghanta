import type { Article } from '@/lib/types';
import { ArticleCardList, ArticleCardMedium } from '@/components/cards';
import { AdSlot } from '@/components/ads';

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
            <ArticleCardList key={article.id} article={article} />
          ))}
        </div>
      )}
      <div className="mt-4 animate-fade-in-up stagger-4">
        <AdSlot placement="hero_sidebar" />
      </div>
    </div>
  );
}
