import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Article, Category } from '@/lib/types';
import { SectionBlock } from '@/components/sections/SectionBlock';
import {
  ArticleCardMedium,
  ArticleCardList,
} from '@/components/cards';
import { OptimizedImage, Badge } from '@/components/ui';
import { ChevronRightIcon } from '@/components/icons';
import { formatDate, formatReadTimeShort } from '@/lib/utils';

export type CategorySectionVariant = 'hero-split' | 'triple-grid' | 'magazine';

interface CategorySectionProps {
  category: Category;
  articles: Article[];
  variant?: CategorySectionVariant;
  /** Optional slot rendered below the sidebar list in the hero-split variant. */
  sidebarSlot?: ReactNode;
  /**
   * Optional slot rendered below the main (lead) article in the hero-split
   * variant. Stretches vertically to bottom-align with the sidebar column.
   */
  mainSlot?: ReactNode;
}

export function CategorySection({
  category,
  articles,
  variant = 'hero-split',
  sidebarSlot,
  mainSlot,
}: CategorySectionProps) {
  if (articles.length === 0) return null;

  const accent = category.color || 'var(--color-primary)';
  const href = `/category/${category.slug}`;

  // Pick the SectionBlock styling per variant so headings also feel different.
  const headerStyle =
    variant === 'triple-grid' ? 'underline' : variant === 'magazine' ? 'tag' : 'bar';
  const kicker =
    variant === 'triple-grid' ? 'Top stories' : variant === 'magazine' ? 'Editor’s pick' : undefined;
  const tinted = variant === 'magazine';

  return (
    <SectionBlock
      title={category.name}
      href={href}
      color={category.color}
      kicker={kicker}
      headerStyle={headerStyle}
      tinted={tinted}
      titleStyle={
        ['sports', 'business'].includes(category.name.toLowerCase())
          ? { fontSize: 'clamp(1.375rem, 3.5vw, 1.875rem)' }
          : undefined
      }
    >
      {variant === 'hero-split' && (
        <HeroSplitLayout articles={articles} sidebarSlot={sidebarSlot} mainSlot={mainSlot} />
      )}
      {variant === 'triple-grid' && (
        <TripleGridLayout articles={articles} accent={accent} />
      )}
      {variant === 'magazine' && (
        <MagazineLayout articles={articles} accent={accent} href={href} />
      )}
    </SectionBlock>
  );
}

// ─────────────────────────────────────────────────────────────────
// 1) HERO-SPLIT — large lead on the left, list on the right.
// ─────────────────────────────────────────────────────────────────
function HeroSplitLayout({
  articles,
  sidebarSlot,
  mainSlot,
}: {
  articles: Article[];
  sidebarSlot?: ReactNode;
  mainSlot?: ReactNode;
}) {
  const [main, ...rest] = articles;
  const sidebarArticles = rest.slice(0, 4);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
      <div className="lg:col-span-2 animate-fade-in-up flex flex-col">
        {main && (
          <ArticleCardMedium
            article={main}
            showCategory={false}
            titleClassName="text-sidebar-title"
          />
        )}
        {mainSlot && (
          <div className="mt-4 flex-1 min-h-45 animate-fade-in-up *:h-full">
            {mainSlot}
          </div>
        )}
      </div>
      <div className="lg:col-span-1">
        {sidebarArticles.map((article, idx) => (
          <div key={article.id}>
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: `${120 + idx * 70}ms` }}
            >
              <ArticleCardList article={article} titleClassName="text-sidebar-title" />
            </div>
            {sidebarSlot && idx === 1 && (
              <div
                className="animate-fade-in-up"
                style={{ animationDelay: `${120 + (idx + 1) * 70}ms` }}
              >
                {sidebarSlot}
              </div>
            )}
          </div>
        ))}
        {sidebarSlot && sidebarArticles.length < 2 && (
          <div className="animate-fade-in-up">{sidebarSlot}</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 2) TRIPLE-GRID — equally weighted 3-column grid of medium cards.
// ─────────────────────────────────────────────────────────────────
function TripleGridLayout({
  articles,
  accent,
}: {
  articles: Article[];
  accent: string;
}) {
  const top = articles.slice(0, 3);
  const rest = articles.slice(3, 5);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {top.map((a, idx) => (
          <div
            key={a.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <ArticleCardMedium
              article={a}
              showCategory={false}
              titleClassName="text-sidebar-title"
            />
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t"
          style={{ borderColor: `color-mix(in srgb, ${accent} 18%, transparent)` }}
        >
          {rest.map((a, idx) => (
            <Link
              key={a.id}
              href={`/article/${a.slug}`}
              className="group flex gap-4 items-start animate-fade-in-up"
              style={{
                animationDelay: `${(idx + 3) * 80}ms`,
                ['--hover-accent' as string]: accent,
              }}
            >
              <div className="w-32 h-24 sm:w-40 sm:h-28 shrink-0 overflow-hidden rounded-md">
                <OptimizedImage
                  src={a.imageUrl}
                  alt={a.imageAlt}
                  fill
                  containerClassName="w-full h-full relative"
                  className="group-hover:scale-110 transition-transform duration-500 ease-out"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-sidebar-title leading-snug text-[var(--color-text-primary)] group-hover:text-[var(--hover-accent)] transition-colors line-clamp-2">
                  {a.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
                  <span>{formatDate(a.publishedAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
                  <span>{formatReadTimeShort(a.readTimeMinutes)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// 3) MAGAZINE — large feature on the right, ranked numbered list on the left.
// ─────────────────────────────────────────────────────────────────
function MagazineLayout({
  articles,
  accent,
  href,
}: {
  articles: Article[];
  accent: string;
  href: string;
}) {
  const feature = articles[0];
  const ranked = articles.slice(1, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
      {/* Ranked list (left, 5/12) */}
      <ol className="lg:col-span-5 order-2 lg:order-1 space-y-4">
        {ranked.map((a, idx) => (
          <li
            key={a.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <Link
              href={`/article/${a.slug}`}
              className="group flex gap-4 items-start py-3 border-b border-[var(--color-border-light)] last:border-b-0"
              style={{ ['--hover-accent' as string]: accent }}
            >
              <span
                className="font-headline text-3xl font-bold leading-none shrink-0 tabular-nums w-8"
                style={{ color: accent }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-base lg:text-lg leading-snug text-[var(--color-text-primary)] group-hover:text-[var(--hover-accent)] transition-colors line-clamp-2">
                  {a.title}
                </h3>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
                  <span>{formatDate(a.publishedAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)]" />
                  <span>{formatReadTimeShort(a.readTimeMinutes)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {/* Feature card (right, 7/12) */}
      <div className="lg:col-span-7 order-1 lg:order-2">
        {feature && (
          <Link
            href={`/article/${feature.slug}`}
            className="group block relative overflow-hidden rounded-md shadow-sm hover:shadow-lg transition-shadow duration-500"
          >
            <div className="aspect-[16/10] relative">
              <OptimizedImage
                src={feature.imageUrl}
                alt={feature.imageAlt}
                fill
                containerClassName="w-full h-full relative"
                className="group-hover:scale-[1.04] transition-transform duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 min-[400px]:p-4 sm:p-5 md:p-6 lg:p-6 xl:p-8 2xl:p-10">
                <Badge color={accent}>Featured</Badge>
                <h2 className="mt-1.5 sm:mt-2.5 md:mt-3 font-headline text-base leading-tight sm:text-2xl sm:leading-snug md:text-3xl lg:text-h1 text-white line-clamp-2 sm:line-clamp-3 transition-all duration-500 ease-out drop-shadow-md group-hover:text-white/90">
                  {feature.title}
                </h2>
                {feature.excerpt && (
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-white/85 line-clamp-2 max-w-xl hidden sm:block">
                    {feature.excerpt}
                  </p>
                )}
                <div className="mt-1.5 sm:mt-3 text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-white/80">
                  {formatReadTimeShort(feature.readTimeMinutes)} ·{' '}
                  <span className="underline decoration-white/40 underline-offset-4">
                    Read story
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}
        <div className="mt-3 flex justify-end">
          <Link
            href={href}
            className="group inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            style={{ ['--accent' as string]: accent }}
          >
            More from this section
            <span className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1">
              <ChevronRightIcon size={14} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
