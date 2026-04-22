import type { Article, Category } from '@/lib/types';
import { SectionBlock } from '@/components/sections/SectionBlock';
import { ArticleCardMedium, ArticleCardList } from '@/components/cards';

interface CategorySectionProps {
  category: Category;
  articles: Article[];
}

export function CategorySection({ category, articles }: CategorySectionProps) {
  if (articles.length === 0) return null;

  const [mainArticle, ...sideArticles] = articles;

  return (
    <SectionBlock
      title={category.name}
      href={`/${category.slug}`}
      color={category.color}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-fade-in-up">
          {mainArticle && (
            <ArticleCardMedium article={mainArticle} showCategory={false} />
          )}
        </div>
        <div className="lg:col-span-1">
          {sideArticles.slice(0, 4).map((article, idx) => (
            <div
              key={article.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${120 + idx * 70}ms` }}
            >
              <ArticleCardList article={article} />
            </div>
          ))}
        </div>
      </div>
    </SectionBlock>
  );
}
