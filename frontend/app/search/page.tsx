import type { Metadata } from 'next';
import Link from 'next/link';
import { mockArticles } from '@/lib/data';
import { ArticleCardList } from '@/components/cards';

export const metadata: Metadata = {
  title: 'Search - 24Ghanta',
  description: 'Search news articles and topics on 24Ghanta.',
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const normalized = query.toLowerCase();

  const results = normalized
    ? mockArticles.filter((a) => {
        const haystack = `${a.title} ${a.excerpt ?? ''} ${a.category.name}`.toLowerCase();
        return haystack.includes(normalized);
      })
    : [];

  return (
    <div className="container py-8 lg:py-10 animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6 animate-fade-in-left">
          <span className="w-12 h-1 bg-[var(--color-primary)] mr-4 animate-expand-x" />
          <h1 className="text-3xl lg:text-4xl font-bold uppercase tracking-wide">
            Search
          </h1>
        </div>

        {!query ? (
          <p className="text-[var(--color-text-secondary)]">
            Type a query in the search bar to find articles. Try{' '}
            <Link href="/search?q=cricket" className="text-[var(--color-primary)] link-underline">
              cricket
            </Link>
            ,{' '}
            <Link href="/search?q=economy" className="text-[var(--color-primary)] link-underline">
              economy
            </Link>
            , or{' '}
            <Link href="/search?q=technology" className="text-[var(--color-primary)] link-underline">
              technology
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {results.length === 0
                ? 'No results'
                : `${results.length} result${results.length === 1 ? '' : 's'}`}{' '}
              for <span className="font-semibold text-[var(--color-text-primary)]">&quot;{query}&quot;</span>
            </p>

            {results.length > 0 && (
              <div className="divide-y divide-[var(--color-border-light)]">
                {results.map((article, idx) => (
                  <div
                    key={article.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <ArticleCardList article={article} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
