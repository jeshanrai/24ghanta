import type { Article } from '@/lib/types';
import { HeroMain } from './HeroMain';
import { HeroSidebar } from './HeroSidebar';

interface HeroSectionProps {
  featuredArticle: Article;
  sidebarArticles: Article[];
}

export function HeroSection({
  featuredArticle,
  sidebarArticles,
}: HeroSectionProps) {
  return (
    <section className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HeroMain article={featuredArticle} />
        <HeroSidebar articles={sidebarArticles} />
      </div>
    </section>
  );
}
