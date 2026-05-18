import { HeroSection, CategorySection, LatestStrip } from '@/components/sections';
import { AdPopup } from '@/components/ui';
import {
  fetchHeroArticles,
  fetchLatestArticles,
  fetchArticlesByCategory,
  fetchCategoryBySlug,
  fetchActivePolls,
} from '@/lib/api';

export const revalidate = 30;

export default async function HomePage() {
  const [
    heroArticles,
    latestArticles,
    sportsCategory,
    sportsArticles,
    businessCategory,
    businessArticles,
    entertainmentCategory,
    entertainmentArticles,
    activePolls,
  ] = await Promise.all([
    fetchHeroArticles(),
    fetchLatestArticles(14),
    fetchCategoryBySlug('sports'),
    fetchArticlesByCategory('sports', 5),
    fetchCategoryBySlug('business'),
    fetchArticlesByCategory('business', 5),
    fetchCategoryBySlug('entertainment'),
    fetchArticlesByCategory('entertainment', 5),
    fetchActivePolls(),
  ]);

  // Exclude hero articles from sidebar and strip to avoid duplicates
  const heroIds = new Set(heroArticles.map((a) => a.id));
  const nonHeroLatest = latestArticles.filter((a) => !heroIds.has(a.id));
  const justInArticles = nonHeroLatest.slice(0, 4);
  const sidebarArticles = nonHeroLatest.slice(4, 9);

  return (
    <div>
      <div className="container pt-6 pb-2">
        {heroArticles.length > 0 ? (
          <HeroSection
            heroArticles={heroArticles}
            sidebarArticles={sidebarArticles}
            activePolls={activePolls}
          />
        ) : (
          <EmptyState
            title="No stories published yet"
            message="Articles created in the admin panel will appear here as soon as they're published."
          />
        )}
      </div>

      {justInArticles.length > 0 && (
        <div className="container pb-2">
          <LatestStrip articles={justInArticles} />
        </div>
      )}

      <div className="container py-12 space-y-14">
        {sportsCategory && sportsArticles.length > 0 && (
          <CategorySection
            category={sportsCategory}
            articles={sportsArticles}
            variant="hero-split"
          />
        )}

        {businessCategory && businessArticles.length > 0 && (
          <CategorySection
            category={businessCategory}
            articles={businessArticles}
            variant="triple-grid"
          />
        )}

        {entertainmentCategory && entertainmentArticles.length > 0 && (
          <CategorySection
            category={entertainmentCategory}
            articles={entertainmentArticles}
            variant="magazine"
          />
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
