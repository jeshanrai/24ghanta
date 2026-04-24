import { HeroSection, VideoSection, ShortStoriesSection, CategorySection } from '@/components/sections';
import {
  fetchFeaturedArticle,
  fetchLatestArticles,
  fetchArticlesByCategory,
  fetchLatestVideos,
  fetchShortStories,
  fetchCategoryBySlug,
  fetchActivePoll,
} from '@/lib/api';

export const revalidate = 30;

export default async function HomePage() {
  const [
    featuredArticle,
    latestArticles,
    videos,
    shortStories,
    sportsCategory,
    sportsArticles,
    businessCategory,
    businessArticles,
    entertainmentCategory,
    entertainmentArticles,
    activePoll,
  ] = await Promise.all([
    fetchFeaturedArticle(),
    fetchLatestArticles(10),
    fetchLatestVideos(4),
    fetchShortStories(10),
    fetchCategoryBySlug('sports'),
    fetchArticlesByCategory('sports', 5),
    fetchCategoryBySlug('business'),
    fetchArticlesByCategory('business', 5),
    fetchCategoryBySlug('entertainment'),
    fetchArticlesByCategory('entertainment', 5),
    fetchActivePoll(),
  ]);

  const sidebarArticles = featuredArticle
    ? latestArticles.filter((a) => a.id !== featuredArticle.id).slice(0, 5)
    : latestArticles.slice(0, 5);

  return (
    <div>
      <div className="container py-6">
        {featuredArticle ? (
          <HeroSection
            featuredArticle={featuredArticle}
            sidebarArticles={sidebarArticles}
            activePoll={activePoll}
          />
        ) : (
          <EmptyState
            title="No stories published yet"
            message="Articles created in the admin panel will appear here as soon as they're published."
          />
        )}

        <div className="section-divider my-8" />

        {videos.length > 0 && <VideoSection videos={videos} />}
      </div>

      {shortStories.length > 0 && <ShortStoriesSection videos={shortStories} />}

      <div className="container py-6">
        {sportsCategory && sportsArticles.length > 0 && (
          <>
            <CategorySection category={sportsCategory} articles={sportsArticles} />
            <div className="section-divider my-8" />
          </>
        )}

        {businessCategory && businessArticles.length > 0 && (
          <>
            <CategorySection category={businessCategory} articles={businessArticles} />
            <div className="section-divider my-8" />
          </>
        )}

        {entertainmentCategory && entertainmentArticles.length > 0 && (
          <CategorySection category={entertainmentCategory} articles={entertainmentArticles} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="py-16 text-center animate-fade-in-up">
      <h2 className="text-h1 font-bold mb-2">{title}</h2>
      <p className="text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}
