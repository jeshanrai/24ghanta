import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getArticleBySlug, getRelatedArticles, getArticlesByCategory } from '@/lib/data';
import { formatDate, formatReadTime } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { ArticleCardList } from '@/components/cards';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article.id, 4);
  const categoryArticles = getArticlesByCategory(article.category.slug, 5).filter(
    (a) => a.id !== article.id
  );

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <article className="lg:col-span-2">
          {/* Category Badge */}
          <div className="mb-4">
            <Link href={`/category/${article.category.slug}`}>
              <Badge variant="primary">{article.category.name}</Badge>
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-[var(--color-text-primary)] leading-tight mb-4">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-xl text-[var(--color-text-secondary)] mb-6">
              {article.excerpt}
            </p>
          )}

          {/* Author and Meta */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
            {article.author.avatarUrl && (
              <Image
                src={article.author.avatarUrl}
                alt={article.author.name}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                {article.author.name}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {formatDate(article.publishedAt)} &middot; {formatReadTime(article.readTimeMinutes)}
              </p>
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.imageAlt}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <p>
              {article.excerpt} This is the beginning of the full article content. In a real
              implementation, this would come from a CMS or database.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <h2>Key Highlights</h2>
            <ul>
              <li>Important point about the topic covered in this article</li>
              <li>Another significant development that readers should know</li>
              <li>Expert opinions and analysis on the matter</li>
              <li>What this means for the future</li>
            </ul>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
              fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
              culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <blockquote>
              &ldquo;This is a significant development that will have far-reaching implications
              for the industry and stakeholders involved.&rdquo;
            </blockquote>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
              doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
              veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            <h2>What Experts Say</h2>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed
              quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
            </p>
            <p>
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur,
              adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et
              dolore magnam aliquam quaerat voluptatem.
            </p>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {/* More from Category */}
          {categoryArticles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
                More in {article.category.name}
              </h3>
              <div className="space-y-4">
                {categoryArticles.slice(0, 4).map((relatedArticle) => (
                  <ArticleCardList key={relatedArticle.id} article={relatedArticle} />
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          <div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
              Related Stories
            </h3>
            <div className="space-y-4">
              {relatedArticles.map((relatedArticle) => (
                <ArticleCardList key={relatedArticle.id} article={relatedArticle} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
