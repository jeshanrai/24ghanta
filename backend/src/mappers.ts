import type { Article, Video, Category, Author, GalleryImage } from './types';

interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string;
  image_alt: string | null;
  published_at: string | null;
  updated_at: string | null;
  read_time_minutes: number | null;
  is_featured: boolean;
  is_breaking: boolean;
  is_published: boolean;
  display_order: number | null;
  views: number | null;
  gallery?: unknown;
  // Joined fields
  category_id: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  category_color?: string | null;
  author_id: number | null;
  author_name?: string | null;
  author_avatar_url?: string | null;
  // Optional joined aggregate
  tag_names?: string[] | null;
}

function normalizeGallery(value: unknown): GalleryImage[] {
  if (!Array.isArray(value)) return [];
  const out: GalleryImage[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const url = (item as { url?: unknown }).url;
    if (typeof url !== 'string' || !url.trim()) continue;
    const caption = (item as { caption?: unknown }).caption;
    const entry: GalleryImage = { url: url.trim() };
    if (typeof caption === 'string' && caption.trim()) {
      entry.caption = caption;
    }
    out.push(entry);
  }
  return out;
}

interface VideoRow {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string;
  video_url: string | null;
  embed_url: string | null;
  duration_seconds: number;
  published_at: string;
  views: number;
  type: string | null;
  is_published: boolean;
  display_order: number | null;
  category_id: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  category_color?: string | null;
}

export function mapArticleRow(row: ArticleRow): Article {
  const category: Category = {
    id: row.category_id != null ? String(row.category_id) : 'uncategorized',
    name: row.category_name ?? 'Uncategorized',
    slug: row.category_slug ?? 'uncategorized',
    color: row.category_color ?? undefined,
  };
  const author: Author = {
    id: row.author_id != null ? String(row.author_id) : '0',
    name: row.author_name ?? 'Editorial Team',
    avatarUrl: row.author_avatar_url ?? undefined,
  };
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    content: row.content ?? undefined,
    category,
    author,
    imageUrl: row.image_url,
    imageAlt: row.image_alt ?? '',
    publishedAt: (row.published_at ?? row.updated_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ?? undefined,
    readTimeMinutes: row.read_time_minutes ?? 5,
    isFeatured: row.is_featured,
    isBreaking: row.is_breaking,
    tags: row.tag_names ?? [],
    gallery: normalizeGallery(row.gallery),
  };
}

export function mapVideoRow(row: VideoRow): Video {
  const category: Category = {
    id: row.category_id != null ? String(row.category_id) : 'uncategorized',
    name: row.category_name ?? 'Uncategorized',
    slug: row.category_slug ?? 'uncategorized',
    color: row.category_color ?? undefined,
  };
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    thumbnailUrl: row.thumbnail_url,
    videoUrl: row.video_url ?? undefined,
    embedUrl: row.embed_url ?? undefined,
    durationSeconds: row.duration_seconds,
    category,
    publishedAt: row.published_at,
    views: row.views,
    type: (row.type as Video['type']) ?? 'video',
  };
}

// SELECT fragments to include everywhere we return articles/videos publicly
export const ARTICLE_SELECT = `
  a.id, a.slug, a.title, a.excerpt, a.content,
  a.image_url, a.image_alt, a.published_at, a.updated_at,
  a.read_time_minutes, a.is_featured, a.is_breaking, a.is_published,
  a.display_order, a.views, a.gallery,
  a.category_id,
  c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
  a.author_id,
  au.name AS author_name, au.avatar_url AS author_avatar_url,
  COALESCE(
    (SELECT array_agg(t.name)
       FROM article_tags at
       JOIN tags t ON t.id = at.tag_id
      WHERE at.article_id = a.id),
    '{}'
  ) AS tag_names
`;

export const ARTICLE_JOIN = `
  LEFT JOIN categories c ON c.id = a.category_id
  LEFT JOIN authors au ON au.id = a.author_id
`;

export const VIDEO_SELECT = `
  v.id, v.slug, v.title, v.description,
  v.thumbnail_url, v.video_url, v.embed_url,
  v.duration_seconds, v.published_at, v.views, v.type,
  v.is_published, v.display_order,
  v.category_id,
  c.name AS category_name, c.slug AS category_slug, c.color AS category_color
`;

export const VIDEO_JOIN = `LEFT JOIN categories c ON c.id = v.category_id`;
