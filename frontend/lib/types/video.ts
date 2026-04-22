import type { Category } from './article';

export type VideoType = 'video' | 'instagram' | 'youtube';

export interface Video {
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  embedUrl?: string;
  durationSeconds: number;
  category: Category;
  publishedAt: string;
  views?: number;
  type?: VideoType;
}
