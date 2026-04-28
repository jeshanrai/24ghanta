import Link from 'next/link';
import { fetchBreakingArticles, fetchCategories } from '@/lib/api';
import { ArticleCardMedium, ArticleCardList } from '@/components/cards';

export const revalidate = 30;

export const metadata = {
  title: 'Breaking News - 24Ghanta',
  description: 'Latest breaking news and urgent updates from 24Ghanta',
};

export default async function BreakingPage() {
  const [articles, allCategories] = await Promise.all([
    fetchBreakingArticles(20),
    fetchCategories(),
  ]);

  if (articles.length === 0) {
    return (
      <div className="container py-8 animate-fade-in-up">
        <div className="flex items-center mb-6">
          <div
            className="w-12 h-1 mr-4 animate-expand-x"
            style={{ backgroundColor: 'var(--color-primary)' }}
          />
          <h1 className="text-3xl font-bold uppercase tracking-wide">Breaking News</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          No breaking news at the moment.
        </p>
      </div>
    );
  }

  const featuredArticles = articles.slice(0, 3);
  const remainingArticles = articles.slice(3);

  return (
    <div className="container py-8 animate-fade-in-up">
      <div className="flex items-center mb-8 animate-fade-in-left">
        <span
          className="w-12 h-1 mr-4 animate-expand-x"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <h1 className="text-3xl font-bold uppercase tracking-wide">Breaking News</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {featuredArticles.map((article, idx) => (
          <div
            key={article.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <ArticleCardMedium article={article} showExcerpt />
          </div>
        ))}
      </div>

      {remainingArticles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-[var(--color-primary)]">
              More Breaking Stories
            </h2>
            <div>
              {remainingArticles.map((article) => (
                <ArticleCardList key={article.id} article={article} />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-lg font-bold mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
                Explore Categories
              </h3>
              <nav className="space-y-2">
                {allCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors group"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color || 'var(--color-primary)' }}
                    />
                    <span className="text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                      {c.name}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
