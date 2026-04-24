import type { Article } from '@/lib/types';
import type { Poll as PollType } from '@/lib/data/polls';
import { ArticleCardLarge } from '@/components/cards';

interface HeroMainProps {
  article: Article;
  activePoll?: PollType | null;
}

export function HeroMain({ article, activePoll }: HeroMainProps) {
  return <ArticleCardLarge article={article} priority activePoll={activePoll} />;
}
