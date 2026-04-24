import type { Article } from '@/lib/types';
import type { Poll as PollType } from '@/lib/data/polls';
import { HeroSlider } from './HeroSlider';
import { HeroSidebar } from './HeroSidebar';
import { Poll } from '@/components/ui';

interface HeroSectionProps {
  heroArticles: Article[];
  sidebarArticles: Article[];
  activePoll?: PollType | null;
}

export function HeroSection({
  heroArticles,
  sidebarArticles,
  activePoll,
}: HeroSectionProps) {
  return (
    <section className="py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 animate-fade-in-up">
          <HeroSlider articles={heroArticles} />
          {activePoll && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] animate-fade-in-up stagger-3">
              <Poll poll={activePoll} compact />
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
