import Link from 'next/link';
import type { Article, Category } from '@/lib/types';
import { SectionBlock } from '@/components/sections/SectionBlock';
import {
  ArticleCardMedium,
  ArticleCardList,
} from '@/components/cards';
import { OptimizedImage, Badge } from '@/components/ui';
import { formatDate, formatReadTimeShort } from '@/lib/utils';

export type CategorySectionVariant = 'hero-split' | 'triple-grid' | 'magazine';

interface CategorySectionProps {
  category: Category;
  articles: Article[];
  variant?: CategorySectionVariant;
}

export function CategorySection({
  category,
  articles,
  variant = 'hero-split',
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
    >
      {variant === 'hero-split' && (
        <HeroSplitLayout articles={articles} />
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
function HeroSplitLayout({ articles }: { articles: Article[] }) {
  const [main, ...rest] = articles;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 animate-fade-in-up">
        {main && (
          <ArticleCardMedium
            article={main}
            showCategory={false}
            titleClassName="text-lg lg:text-xl"
          />
        )}
      </div>
      <div className="lg:col-span-1">
        {rest.slice(0, 4).map((article, idx) => (
          <div
            key={article.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${120 + idx * 70}ms` }}
          >
            <ArticleCardList article={article} titleClassName="text-sidebar-title" />
          </div>
        ))}
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
              titleClassName="text-lg lg:text-xl"
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
              style={{ animationDelay: `${(idx + 3) * 80}ms` }}
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
                <h3 className="font-headline text-base lg:text-lg leading-snug text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
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
            >
              <span
                className="font-headline text-3xl font-bold leading-none shrink-0 tabular-nums w-8"
                style={{ color: accent }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-base lg:text-lg leading-snug text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
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
              <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
                <Badge color={accent}>Featured</Badge>
                <h3 className="mt-3 font-headline text-h1 lg:text-hero/[1.1] text-white line-clamp-3 leading-tight">
                  {feature.title}
                </h3>
                {feature.excerpt && (
                  <p className="mt-2 text-sm text-white/85 line-clamp-2 max-w-xl hidden sm:block">
                    {feature.excerpt}
                  </p>
                )}
                <div className="mt-3 text-[11px] uppercase tracking-wider font-semibold text-white/80">
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
            className="text-xs uppercase tracking-wider font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            style={{ ['--accent' as string]: accent }}
          >
            More from this section →
          </Link>
        </div>
      </div>
    </div>
  );
}
