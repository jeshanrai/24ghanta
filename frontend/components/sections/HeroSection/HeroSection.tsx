import type { Article } from '@/lib/types';
import type { Poll as PollType } from '@/lib/data/polls';
import type { Ad } from '@/lib/types/ad';
import { HeroSlider } from './HeroSlider';
import { HeroSidebar } from './HeroSidebar';
import { Poll } from '@/components/ui';
import { AdSlot } from '@/components/ads';

interface HeroSectionProps {
  heroArticles: Article[];
  sidebarArticles: Article[];
  // Array now — Poll component handles slider behaviour for multi-poll lists.
  // Single-poll deployments still work (just an array of length 1).
  activePolls?: PollType[];
  pollBottomAd?: Ad | null;
}

export function HeroSection({
  heroArticles,
  sidebarArticles,
  activePolls,
  pollBottomAd,
}: HeroSectionProps) {
  const isRenderable = (ad?: Ad | null) =>
    !!ad &&
    ((ad.adType === 'html' && !!ad.htmlContent) ||
      (ad.adType !== 'html' && !!ad.imageUrl));

  const hasRenderablePollBottomAd = isRenderable(pollBottomAd);

  return (
    <section className="py-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 animate-fade-in-up">
          <HeroSlider articles={heroArticles} />
          {activePolls && activePolls.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] animate-fade-in-up stagger-3">
              <Poll polls={activePolls} compact />
            </div>
          )}
          {hasRenderablePollBottomAd && (
            <div className="mt-6 animate-fade-in-up">
              <AdSlot
                placement="landing_poll_bottom"
                ad={pollBottomAd}
                className="w-full shadow-sm rounded-md overflow-hidden bg-white"
                aspectClassName="h-[180px] sm:h-[200px] lg:h-[220px]"
              />
            </div>
          )}
        </div>
        <div className="lg:col-span-1 animate-fade-in-up stagger-2">
          <HeroSidebar articles={sidebarArticles} />
        </div>
      </div>
    </section>
  );
}
