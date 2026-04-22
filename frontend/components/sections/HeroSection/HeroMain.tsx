import type { Article } from '@/lib/types';
import { ArticleCardLarge } from '@/components/cards';

interface HeroMainProps {
  article: Article;
}

export function HeroMain({ article }: HeroMainProps) {
  return <ArticleCardLarge article={article} priority />;
}
