import type { Article } from '@/lib/types';
import { ArticleCardList, ArticleCardMedium, GenZPromoCard, UpliftLocalPromoCard } from '@/components/cards';

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
      <div className="mt-4 animate-fade-in-up stagger-3">
        <GenZPromoCard />
      </div>
      <div className="mt-4 animate-fade-in-up stagger-4">
        <UpliftLocalPromoCard />
      </div>
      {restArticles.length > 0 && (
        <div className="mt-4 animate-fade-in-up stagger-5">
          {restArticles.slice(0, 1).map((article) => (
            <ArticleCardList key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
