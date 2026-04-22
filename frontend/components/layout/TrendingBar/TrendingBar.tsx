import { trendingTopics } from '@/lib/constants';
import { TrendingLink } from './TrendingLink';

export function TrendingBar() {
  return (
    <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="container">
        <div className="flex items-center gap-4 py-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap">
            Trending:
          </span>
          <div className="flex items-center gap-4">
            {trendingTopics.map((topic, index) => (
              <div key={topic.id} className="flex items-center gap-4">
                <TrendingLink topic={topic} />
                {index < trendingTopics.length - 1 && (
                  <span className="text-[var(--color-border-dark)]">•</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
