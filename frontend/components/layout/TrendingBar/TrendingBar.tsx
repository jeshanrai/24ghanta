import { trendingTopics } from '@/lib/constants';
import { TrendingLink } from './TrendingLink';

export function TrendingBar() {
  return (
    <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] animate-fade-in-down">
      <div className="container">
        <div className="flex items-center gap-4 py-2 overflow-x-auto scrollbar-hide">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] whitespace-nowrap">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary)] opacity-75 animate-pulse-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            </span>
            Trending:
          </span>
          <div className="flex items-center gap-4">
            {trendingTopics.map((topic, index) => (
              <div
                key={topic.id}
                className="flex items-center gap-4 animate-fade-in-left"
                style={{ animationDelay: `${index * 60}ms` }}
              >
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
