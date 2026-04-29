import type { MetadataRoute } from 'next';
import { fetchAllArticleSlugs, fetchCategories } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/breaking',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/videos',
    '/genz',
    '/uplift-local',
  ].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'hourly' : 'weekly',
    priority: p === '' ? 1 : 0.5,
  }));

  let articleRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];

  try {
    const [slugs, cats] = await Promise.all([
      fetchAllArticleSlugs(),
      fetchCategories(),
    ]);
    articleRoutes = slugs.map((slug) => ({
      url: `${SITE_URL}/article/${slug}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
    categoryRoutes = cats.map((c) => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    }));
  } catch {
    // If the API is unreachable, still return the static routes.
  }

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
