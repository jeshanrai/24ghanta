import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  fetchArticleBySlug,
  fetchRelatedArticles,
  fetchArticlesByCategory,
} from '@/lib/api';
import {
  formatDate,
  formatFullDate,
  formatReadTime,
} from '@/lib/utils';
import { Badge, ShareButtons, SafeImage } from '@/components/ui';
import { ArticleContent, ArticleGallery } from '@/components/article';
import { AdSlot } from '@/components/ads';

export const revalidate = 30;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) return { title: 'Article not found - 24Ghanta' };

  return {
    title: `${article.title} - 24Ghanta`,
    description: article.excerpt ?? article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.imageUrl],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author.name],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) notFound();

  const [relatedArticles, categoryArticlesRaw] = await Promise.all([
    fetchRelatedArticles(slug, 4),
    fetchArticlesByCategory(article.category.slug, 5),
  ]);
  const categoryArticles = categoryArticlesRaw.filter((a) => a.id !== article.id);

  return (
    <div className="container py-8 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <article className="lg:col-span-2">
          {/* Category + Breaking */}
          <div className="flex items-center gap-2 mb-4">
            <Link href={`/category/${article.category.slug}`}>
              <Badge color={article.category.color}>{article.category.name}</Badge>
            </Link>
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--color-breaking)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75 animate-pulse-dot" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-breaking)]" />
                </span>
                Breaking
              </span>
            )}
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              {article.author.avatarUrl && (
                <SafeImage
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
                  <time dateTime={article.publishedAt}>{formatFullDate(article.publishedAt)}</time>
                  {' · '}
                  {formatReadTime(article.readTimeMinutes)}
                </p>
              </div>
            </div>
            <ShareButtons title={article.title} slug={article.slug} />
          </div>

          {/* Featured Image */}
          <figure className="mb-8">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <SafeImage
                src={article.imageUrl}
                alt={article.imageAlt}
                fill
                className="object-cover"
                priority
              />
            </div>
            {article.imageAlt && (
              <figcaption className="mt-2 text-xs text-[var(--color-text-muted)] italic">
                {article.imageAlt}
              </figcaption>
            )}
          </figure>

          {/* Article Content (rich HTML from Tiptap, sanitised server-side) */}
          <ArticleContent html={article.content || ''} />

          {/* Inline Ad */}
          <AdSlot
            placement="article_inline"
            className="my-10"
          />

          {/* Photo gallery */}
          {article.gallery && article.gallery.length > 0 && (
            <ArticleGallery images={article.gallery} />
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)] hover:text-white text-sm rounded-full transition-colors duration-200"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer share */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Published {formatDate(article.publishedAt)} in{' '}
              <Link
                href={`/category/${article.category.slug}`}
                className="text-[var(--color-primary)] font-medium link-underline"
              >
                {article.category.name}
              </Link>
            </p>
            <ShareButtons title={article.title} slug={article.slug} />
          </div>
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
          {relatedArticles.length > 0 && (
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
          )}
          {/* Sidebar Ad */}
          <div className="sticky top-24">
            <AdSlot
              placement="article_sidebar"
              aspectClassName="aspect-[300/600]"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
