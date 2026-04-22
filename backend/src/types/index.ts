// ── Author ──
export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

// ── Category ──
export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

// ── Article ──
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  category: Category;
  author: Author;
  imageUrl: string;
  imageAlt: string;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  isFeatured?: boolean;
  isBreaking?: boolean;
  tags?: string[];
}

// ── Video ──
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

// ── GenZ Article ──
export interface GenZArticle {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  imageUrl: string;
  imageAlt: string;
  publishedAt: string;
  readTimeMinutes: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  author: Author;
  reactions: {
    fire: number;
    laugh: number;
    wow: number;
    hundred: number;
    heart: number;
  };
  tags: string[];
}

// ── Poll ──
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string;
  isActive: boolean;
}

// ── Local Media ──
export interface LocalMedia {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  mediaUrl: string;
  caption?: string;
  location?: string;
  publishedAt: string;
  likes: number;
}

// ── Navigation ──
export interface NavItem {
  id: string;
  label: string;
  href: string;
  children?: NavItem[];
}

export interface TrendingTopic {
  id: string;
  label: string;
  href: string;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}
