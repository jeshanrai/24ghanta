import type { Article } from '@/lib/types';
import { ArticleCardList, ArticleCardMedium, GenZPromoCard, UpliftLocalPromoCard } from '@/components/cards';

interface HeroSidebarProps {
  articles: Article[];
}

export function HeroSidebar({ articles }: HeroSidebarProps) {
  if (articles.length === 0) return null;

  const [topArticle, ...restArticles] = articles;

  return (
    <div className="lg:col-span-1">
      {topArticle && (
        <ArticleCardMedium
          article={topArticle}
          showExcerpt={false}
          showCategory={false}
        />
      )}
      <div className="mt-4">
        <GenZPromoCard />
      </div>
      <div className="mt-4">
        <UpliftLocalPromoCard />
      </div>
      {restArticles.length > 0 && (
        <div className="mt-4">
          {restArticles.slice(0, 1).map((article) => (
            <ArticleCardList key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
