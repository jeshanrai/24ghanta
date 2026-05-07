import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchArticlesByCategory, fetchCategoryBySlug, fetchCategories } from '@/lib/api';
import { ArticleCardMedium, ArticleCardList } from '@/components/cards';

export const revalidate = 30;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) return { title: 'Category Not Found' };
  return {
    title: `${category.name} News - 24Ghanta`,
    description: `Latest ${category.name} news and updates from 24Ghanta`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, articles, allCategories] = await Promise.all([
    fetchCategoryBySlug(slug),
    fetchArticlesByCategory(slug, 20),
    fetchCategories(),
  ]);

  if (!category) notFound();

  if (articles.length === 0) {
    return (
      <div className="container py-8 animate-fade-in-up">
        <div className="flex items-center mb-6">
          <div
            className="w-12 h-1 mr-4 animate-expand-x"
            style={{ backgroundColor: category.color || 'var(--color-primary)' }}
          />
          <h1 className="text-3xl font-bold uppercase tracking-wide">{category.name}</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          No articles published in this category yet.
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
          style={{ backgroundColor: category.color || 'var(--color-primary)' }}
        />
        <h1 className="text-3xl font-bold uppercase tracking-wide">{category.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {featuredArticles.map((article, idx) => (
          <div
            key={article.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <ArticleCardMedium article={article} showCategory={false} showExcerpt />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 pb-2 border-b-2 border-[var(--color-primary)]">
            More {category.name} Stories
          </h2>
          {remainingArticles.length > 0 ? (
            <div>
              {remainingArticles.map((article) => (
                <ArticleCardList key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-text-secondary)] italic mb-8">
              No more stories in this category at the moment.
            </p>
          )}
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
                  className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors group ${
                    c.slug === slug ? 'bg-[var(--color-surface)] font-bold' : ''
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color || 'var(--color-primary)' }}
                  />
                  <span className={`transition-colors ${
                    c.slug === slug 
                      ? 'text-[var(--color-primary)]' 
                      : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]'
                  }`}>
                    {c.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
