import { Fragment } from 'react';
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
import Image from 'next/image';
import { resolveImageSrc } from '@/lib/safeImage';
import { ArticleContent, ArticleGallery } from '@/components/article';
import { AdSlot } from '@/components/ads';
import { ArticleCardList } from '@/components/cards';

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
    <div className="container py-6 sm:py-8 animate-fade-in-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Content */}
        <article className="lg:col-span-2">
          {/* Category + Breaking */}
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Link href={`/category/${article.category.slug}`}>
              <Badge color={article.category.color}>{article.category.name}</Badge>
            </Link>
            {article.isBreaking && (
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-[var(--color-breaking)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-breaking)] opacity-75 animate-pulse-dot" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-breaking)]" />
                </span>
                Breaking
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-headline text-base leading-tight sm:text-2xl sm:leading-snug md:text-3xl lg:text-h1 text-[var(--color-text-primary)] transition-all duration-500 ease-out drop-shadow-md mb-3 sm:mb-4 break-words hyphens-auto">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-deck text-[var(--color-text-secondary)] mb-4 sm:mb-6 leading-relaxed">
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
                <p className="text-xs text-[var(--color-text-secondary)]">
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
            <Image
              src={resolveImageSrc(article.imageUrl)}
              alt={article.imageAlt || article.title}
              width={1600}
              height={900}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              className="w-full h-auto rounded-lg shadow-sm"
            />
            {article.imageAlt && (
              <figcaption className="mt-3 text-small text-[var(--color-text-secondary)] font-medium italic border-l-2 border-[var(--color-primary)] pl-3">
                {article.imageAlt}
              </figcaption>
            )}
          </figure>

          {/* Article Content (rich HTML from Tiptap, sanitised server-side) */}
          <ArticleContent html={article.content || ''} />

          {/* Inline Ad — half-height banner; bottom-clipped so top stays upright */}
          <div className="my-10 w-full">
            <AdSlot
              placement="article_inline"
              className="block w-full"
              aspectClassName="aspect-[4/1] sm:aspect-[4/1]"
            />
          </div>

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
                    className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary)] hover:text-white text-small rounded-full transition-colors duration-200"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer share */}
          <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
            <p className="text-small text-[var(--color-text-secondary)]">
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
          {/* Sidebar Ad */}
          <div className="mb-8 w-full">
            {/* Below lg the aside stacks at full container width, so a 2:1
                ratio reads as a billboard. Flatten to banner ratios on
                small/medium and restore 300×150 (IAB MPU half) at lg+ where
                the column is ~1/3 wide. */}
            <AdSlot
              placement="article_sidebar"
              aspectClassName="aspect-[3/1] sm:aspect-[4/1] lg:aspect-[300/150]"
            />
          </div>

          {/* More from Category — in-feed ad after every 3rd article. */}
          {categoryArticles.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sidebar-title font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
                More in {article.category.name}
              </h3>
              <div className="space-y-4">
                {categoryArticles.slice(0, 4).map((relatedArticle, idx) => (
                  <Fragment key={relatedArticle.id}>
                    <ArticleCardList article={relatedArticle} titleClassName="text-sidebar-title" />
                    {/* Inject after positions 3, 6, 9… so the ad mirrors the
                        row layout of the card immediately above it. */}
                    {(idx + 1) % 3 === 0 && (
                      <AdSlot
                        placement="in_feed_list"
                        className="shadow-sm rounded-md overflow-hidden bg-white w-full"
                        aspectClassName="h-[112px] sm:h-[128px] lg:h-[140px]"
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles — same every-3rd pattern. */}
          {relatedArticles.length > 0 && (
            <div>
              <h3 className="text-sidebar-title font-bold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[var(--color-primary)]">
                Related Stories
              </h3>
              <div className="space-y-4">
                {relatedArticles.map((relatedArticle, idx) => (
                  <Fragment key={relatedArticle.id}>
                    <ArticleCardList article={relatedArticle} titleClassName="text-sidebar-title" />
                    {(idx + 1) % 3 === 0 && (
                      <AdSlot
                        placement="in_feed_list"
                        className="shadow-sm rounded-md overflow-hidden bg-white w-full"
                        aspectClassName="h-[112px] sm:h-[128px] lg:h-[140px]"
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
