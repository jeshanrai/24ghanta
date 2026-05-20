import { HeroSection, CategorySection, LatestStrip, ReelsSection } from '@/components/sections';
import { AdPopup } from '@/components/ui';
import { AdSlot } from '@/components/ads';
import {
  fetchHeroArticles,
  fetchLatestArticles,
  fetchArticlesByCategory,
  fetchCategoryBySlug,
  fetchActivePolls,
  fetchAd,
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
    sportsSidebarAd,
    pollBottomAd,
    justInSportsBetweenAd,
    justInSportsBetweenAd2,
    sportsBottomAd,
  ] = await Promise.all([
    fetchHeroArticles(),
    fetchLatestArticles(16),
    fetchCategoryBySlug('sports'),
    fetchArticlesByCategory('sports', 6),
    fetchCategoryBySlug('business'),
    fetchArticlesByCategory('business', 5),
    fetchCategoryBySlug('entertainment'),
    fetchArticlesByCategory('entertainment', 5),
    fetchActivePolls(),
    fetchAd('landing_sports_sidebar'),
    fetchAd('landing_poll_bottom'),
    fetchAd('landing_between_justin_sports'),
    fetchAd('landing_between_justin_sports_2'),
    fetchAd('landing_sports_bottom'),
  ]);

  // Exclude hero articles from sidebar and strip to avoid duplicates
  const heroIds = new Set(heroArticles.map((a) => a.id));
  const nonHeroLatest = latestArticles.filter((a) => !heroIds.has(a.id));
  const justInArticles = nonHeroLatest.slice(0, 4);
  const sidebarArticles = nonHeroLatest.slice(4, 9);

  // An ad is renderable only if it has displayable content for its type.
  const hasRenderableAd = (ad: any) =>
    !!ad &&
    ((ad.adType === 'html' && !!ad.htmlContent) ||
      (ad.adType !== 'html' && !!ad.imageUrl));

  const sportsSidebarAdRenderable = hasRenderableAd(sportsSidebarAd);
  const sportsBottomAdRenderable = hasRenderableAd(sportsBottomAd);
  const justInSportsBetweenAdRenderable = hasRenderableAd(justInSportsBetweenAd);
  const justInSportsBetweenAd2Renderable = hasRenderableAd(justInSportsBetweenAd2);

  return (
    <div>
      <div className="container pt-6 pb-10">
        {heroArticles.length > 0 ? (
          <HeroSection
            heroArticles={heroArticles}
            sidebarArticles={sidebarArticles}
            activePolls={activePolls}
            pollBottomAd={pollBottomAd}
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

      {(justInSportsBetweenAdRenderable || justInSportsBetweenAd2Renderable) && (
        <div className="container pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-fade-in-up">
            {justInSportsBetweenAdRenderable && (
              <AdSlot
                placement="landing_between_justin_sports"
                ad={justInSportsBetweenAd}
                className="w-full shadow-sm rounded-md overflow-hidden bg-white"
                aspectClassName="h-[112px] sm:h-[128px] lg:h-[140px]"
              />
            )}
            {justInSportsBetweenAd2Renderable && (
              <AdSlot
                placement="landing_between_justin_sports_2"
                ad={justInSportsBetweenAd2}
                className="w-full shadow-sm rounded-md overflow-hidden bg-white"
                aspectClassName="h-[112px] sm:h-[128px] lg:h-[140px]"
              />
            )}
          </div>
        </div>
      )}

      <div className="container pt-6 pb-12 space-y-14">
        {sportsCategory && sportsArticles.length > 0 && (
          <CategorySection
            category={sportsCategory}
            articles={sportsArticles}
            variant="hero-split"
            sidebarSlot={
              sportsSidebarAdRenderable ? (
                <AdSlot
                  placement="landing_sports_sidebar"
                  ad={sportsSidebarAd}
                  className="shadow-sm rounded-md overflow-hidden bg-white w-full"
                  aspectClassName="h-[112px] sm:h-[128px] lg:h-[140px]"
                />
              ) : null
            }
            mainSlot={
              sportsBottomAdRenderable ? (
                <AdSlot
                  placement="landing_sports_bottom"
                  ad={sportsBottomAd}
                  className="w-full h-full shadow-sm rounded-md overflow-hidden bg-white"
                  aspectClassName="h-full"
                />
              ) : null
            }
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

        <ReelsSection />
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
