import type { Article } from '@/lib/types';
import { ArticleCardMedium } from '@/components/cards';
import { SectionBlock } from '@/components/sections/SectionBlock';

interface LatestStripProps {
  articles: Article[];
}

export function LatestStrip({ articles }: LatestStripProps) {
  if (articles.length === 0) return null;

  return (
    <SectionBlock title="Just In" headerStyle="bar">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {articles.slice(0, 4).map((article, idx) => (
          <div
            key={article.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 70}ms` }}
          >
            <ArticleCardMedium
              article={article}
              showExcerpt={false}
              showCategory
            />
          </div>
        ))}
      </div>
    </SectionBlock>
  );
}
