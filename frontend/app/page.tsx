import { HeroSection, VideoSection, ShortStoriesSection, CategorySection } from '@/components/sections';
import {
  fetchHeroArticles,
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
    heroArticles,
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
    fetchHeroArticles(),
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

  // Exclude hero articles from the sidebar to avoid duplicates
  const heroIds = new Set(heroArticles.map((a) => a.id));
  const sidebarArticles = latestArticles
    .filter((a) => !heroIds.has(a.id))
    .slice(0, 5);

  return (
    <div>
      <div className="container pt-6 pb-10">
        {heroArticles.length > 0 ? (
          <HeroSection
            heroArticles={heroArticles}
            sidebarArticles={sidebarArticles}
            activePoll={activePoll}
          />
        ) : (
          <EmptyState
            title="No stories published yet"
            message="Articles created in the admin panel will appear here as soon as they're published."
          />
        )}
      </div>

      {videos.length > 0 && (
        <div className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
          <div className="container py-12">
            <VideoSection videos={videos} />
          </div>
        </div>
      )}

      {shortStories.length > 0 && <ShortStoriesSection videos={shortStories} />}

      <div className="container py-12 space-y-12">
        {sportsCategory && sportsArticles.length > 0 && (
          <CategorySection category={sportsCategory} articles={sportsArticles} />
        )}

        {businessCategory && businessArticles.length > 0 && (
          <CategorySection category={businessCategory} articles={businessArticles} />
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
