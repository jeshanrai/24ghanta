import type { Article } from '@/lib/types';
import { ArticleCardLarge } from '@/components/cards';

interface HeroMainProps {
  article: Article;
}

export function HeroMain({ article }: HeroMainProps) {
  return (
    <div className="lg:col-span-2">
      <ArticleCardLarge article={article} priority />
    </div>
  );
}
