import type { Category } from '@/lib/types';

export const categories: Category[] = [
  { id: 'world', name: 'World', slug: 'world', color: '#c41d2f' },
  { id: 'india', name: 'India', slug: 'india', color: '#1d4ed8' },
  { id: 'politics', name: 'Politics', slug: 'politics', color: '#7c3aed' },
  { id: 'sports', name: 'Sports', slug: 'sports', color: '#059669' },
  { id: 'entertainment', name: 'Entertainment', slug: 'entertainment', color: '#db2777' },
  { id: 'business', name: 'Business', slug: 'business', color: '#d97706' },
  { id: 'technology', name: 'Technology', slug: 'technology', color: '#0891b2' },
  { id: 'health', name: 'Health', slug: 'health', color: '#16a34a' },
  { id: 'lifestyle', name: 'Lifestyle', slug: 'lifestyle', color: '#be185d' },
  { id: 'science', name: 'Science', slug: 'science', color: '#4f46e5' },
  { id: 'genz', name: 'Gen Z', slug: 'genz', color: '#FF6B6B' },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((cat) => cat.slug === slug);
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

export function getAllCategorySlugs(): string[] {
  return categories.map((cat) => cat.slug);
}
