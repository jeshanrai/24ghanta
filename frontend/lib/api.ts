import type { Article, Category, Video, Ad } from '@/lib/types';
import type { Poll } from '@/lib/data/polls';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Short revalidation so admin-published content shows up fast
const REVALIDATE_SECONDS = 30;

async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      if (res.status !== 404) {
        console.error(`API ${path} returned ${res.status}`);
      }
      return null;
    }
    const payload = (await res.json()) as { data?: T };
    return payload.data ?? null;
  } catch (err) {
    console.error(`API ${path} fetch failed:`, err);
    return null;
  }
}

// ── Articles ─────────────────────────────────────────────
export async function fetchFeaturedArticle(): Promise<Article | null> {
  return api<Article>('/api/articles/featured');
}

export async function fetchHeroArticles(): Promise<Article[]> {
  return (await api<Article[]>('/api/articles/hero')) ?? [];
}

export async function fetchLatestArticles(limit = 10): Promise<Article[]> {
  return (await api<Article[]>(`/api/articles?limit=${limit}`)) ?? [];
}

export async function fetchBreakingArticles(limit = 20): Promise<Article[]> {
  return (await api<Article[]>(`/api/articles/breaking?limit=${limit}`)) ?? [];
}

export async function fetchArticlesByCategory(
  slug: string,
  limit = 5
): Promise<Article[]> {
  return (
    (await api<Article[]>(
      `/api/articles?category=${encodeURIComponent(slug)}&limit=${limit}`
    )) ?? []
  );
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  return api<Article>(`/api/articles/${encodeURIComponent(slug)}`);
}

export async function fetchRelatedArticles(
  slug: string,
  limit = 4
): Promise<Article[]> {
  return (
    (await api<Article[]>(
      `/api/articles/${encodeURIComponent(slug)}/related?limit=${limit}`
    )) ?? []
  );
}

export async function fetchAllArticleSlugs(): Promise<string[]> {
  return (await api<string[]>('/api/articles/slugs')) ?? [];
}

export async function fetchSearchArticles(query: string, limit = 20): Promise<Article[]> {
  if (!query.trim()) return [];
  return (
    (await api<Article[]>(
      `/api/articles/search?q=${encodeURIComponent(query)}&limit=${limit}`
    )) ?? []
  );
}

// ── Videos ──────────────────────────────────────────────
export async function fetchLatestVideos(limit = 8): Promise<Video[]> {
  return (await api<Video[]>(`/api/videos?limit=${limit}`)) ?? [];
}

export async function fetchShortStories(limit = 10): Promise<Video[]> {
  return (await api<Video[]>(`/api/videos/shorts?limit=${limit}`)) ?? [];
}

export async function fetchVideoBySlug(slug: string): Promise<Video | null> {
  return api<Video>(`/api/videos/${encodeURIComponent(slug)}`);
}

// ── Categories ──────────────────────────────────────────
export async function fetchCategories(): Promise<Category[]> {
  return (await api<Category[]>('/api/categories')) ?? [];
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  return api<Category>(`/api/categories/${encodeURIComponent(slug)}`);
}

// ── Polls ──────────────────────────────────────────────
export async function fetchActivePoll(): Promise<Poll | null> {
  return api<Poll>('/api/polls/active');
}

// ── Trending ───────────────────────────────────────────
export interface TrendingItem {
  id: number;
  label: string;
  href: string;
  badge: string | null;
}

export async function fetchTrendingItems(): Promise<TrendingItem[]> {
  return (await api<TrendingItem[]>('/api/trending')) ?? [];
}

// ── Ads ────────────────────────────────────────────────
export async function fetchAd(placement: string): Promise<Ad | null> {
  return api<Ad>(`/api/ads/${encodeURIComponent(placement)}`);
}

export const AD_API_URL = API;
