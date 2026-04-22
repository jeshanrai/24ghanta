import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticlesByCategory } from '@/lib/data';
import { getCategoryBySlug, getAllCategorySlugs } from '@/lib/constants';
import { ArticleCardMedium, ArticleCardList } from '@/components/cards';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const slugs = getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} News - 24Ghanta`,
    description: `Latest ${category.name} news and updates from 24Ghanta`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const articles = getArticlesByCategory(slug, 20);

  if (articles.length === 0) {
    return (
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <div
            className="w-12 h-1 mr-4"
            style={{ backgroundColor: category.color || 'var(--color-primary)' }}
          />
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
            {category.name}
          </h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          No articles found in this category.
        </p>
      </div>
    );
  }

  const featuredArticles = articles.slice(0, 3);
  const remainingArticles = articles.slice(3);

  return (
    <div className="container py-8">
      {/* Category Header */}
      <div className="flex items-center mb-8">
        <div
          className="w-12 h-1 mr-4"
          style={{ backgroundColor: category.color || 'var(--color-primary)' }}
        />
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
          {category.name}
        </h1>
      </div>

      {/* Featured Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {featuredArticles.map((article) => (
          <ArticleCardMedium
            key={article.id}
            article={article}
            showCategory={false}
            showExcerpt={true}
          />
        ))}
      </div>

      {/* Remaining Articles */}
      {remainingArticles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[var(--color-primary)]">
              More {category.name} Stories
            </h2>
            <div>
              {remainingArticles.map((article) => (
                <ArticleCardList key={article.id} article={article} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
                Explore Categories
              </h3>
              <nav className="space-y-2">
                <CategoryLink href="/category/world" color="#c41d2f">
                  World
                </CategoryLink>
                <CategoryLink href="/category/india" color="#1d4ed8">
                  India
                </CategoryLink>
                <CategoryLink href="/category/politics" color="#7c3aed">
                  Politics
                </CategoryLink>
                <CategoryLink href="/category/sports" color="#059669">
                  Sports
                </CategoryLink>
                <CategoryLink href="/category/entertainment" color="#db2777">
                  Entertainment
                </CategoryLink>
                <CategoryLink href="/category/business" color="#d97706">
                  Business
                </CategoryLink>
                <CategoryLink href="/category/technology" color="#0891b2">
                  Technology
                </CategoryLink>
                <CategoryLink href="/category/health" color="#16a34a">
                  Health
                </CategoryLink>
                <CategoryLink href="/category/lifestyle" color="#be185d">
                  Lifestyle
                </CategoryLink>
              </nav>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

interface CategoryLinkProps {
  href: string;
  color: string;
  children: React.ReactNode;
}

function CategoryLink({ href, color, children }: CategoryLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--color-surface)] transition-colors group"
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
        {children}
      </span>
    </Link>
  );
}
