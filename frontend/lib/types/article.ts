export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

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
