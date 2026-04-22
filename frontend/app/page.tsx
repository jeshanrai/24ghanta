import { HeroSection, VideoSection, ShortStoriesSection, CategorySection } from '@/components/sections';
import {
  getFeaturedArticle,
  getLatestArticles,
  getArticlesByCategory,
  getLatestVideos,
  getShortStories,
} from '@/lib/data';
import { categories } from '@/lib/constants';

export default function HomePage() {
  const featuredArticle = getFeaturedArticle();
  const latestArticles = getLatestArticles(10);
  const sidebarArticles = latestArticles.filter((a) => a.id !== featuredArticle.id).slice(0, 5);

  const videos = getLatestVideos(4);
  const shortStories = getShortStories(10);

  const sportsCategory = categories.find((c) => c.slug === 'sports')!;
  const sportsArticles = getArticlesByCategory('sports', 5);

  const businessCategory = categories.find((c) => c.slug === 'business')!;
  const businessArticles = getArticlesByCategory('business', 5);

  const entertainmentCategory = categories.find((c) => c.slug === 'entertainment')!;
  const entertainmentArticles = getArticlesByCategory('entertainment', 5);

  return (
    <div>
      <div className="container py-6">
        <HeroSection
          featuredArticle={featuredArticle}
          sidebarArticles={sidebarArticles}
        />

        <div className="my-8 border-t border-[var(--color-border)]" />

        <VideoSection videos={videos} />
      </div>

      <ShortStoriesSection videos={shortStories} />

      <div className="container py-6">
        {sportsArticles.length > 0 && (
          <>
            <CategorySection category={sportsCategory} articles={sportsArticles} />
            <div className="my-8 border-t border-[var(--color-border)]" />
          </>
        )}

        {businessArticles.length > 0 && (
          <>
            <CategorySection category={businessCategory} articles={businessArticles} />
            <div className="my-8 border-t border-[var(--color-border)]" />
          </>
        )}

        {entertainmentArticles.length > 0 && (
          <CategorySection category={entertainmentCategory} articles={entertainmentArticles} />
        )}
      </div>
    </div>
  );
}
