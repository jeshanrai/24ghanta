import type { Author } from '@/lib/types';

const genzAuthors: Author[] = [
  { id: 'gz1', name: 'Zara Khan', avatarUrl: 'https://picsum.photos/seed/gzauthor1/100/100' },
  { id: 'gz2', name: 'Arjun Mehta', avatarUrl: 'https://picsum.photos/seed/gzauthor2/100/100' },
  { id: 'gz3', name: 'Priya Sharma', avatarUrl: 'https://picsum.photos/seed/gzauthor3/100/100' },
];

const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

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

export const genzArticles: GenZArticle[] = [
  {
    id: 'gz1',
    slug: 'chatgpt-can-now-see-memes',
    title: 'ChatGPT Can Now See Your Memes and It\'s Lowkey Terrifying 💀',
    excerpt: 'OpenAI just dropped multimodal vision and the internet is having a field day.',
    imageUrl: 'https://picsum.photos/seed/genz1/800/600',
    imageAlt: 'AI robot looking at memes',
    publishedAt: hoursAgo(1),
    readTimeMinutes: 3,
    category: { id: 'tech', name: 'Tech', slug: 'technology' },
    author: genzAuthors[0],
    reactions: { fire: 1234, laugh: 567, wow: 890, hundred: 234, heart: 456 },
    tags: ['viral', 'tech', 'ai'],
  },
  {
    id: 'gz2',
    slug: 'indian-tiktoker-breaks-internet',
    title: 'This Indian Creator Just Broke the Internet With One Dance 🕺',
    excerpt: 'From 0 to 10M followers in 48 hours. Here\'s how they did it.',
    imageUrl: 'https://picsum.photos/seed/genz2/800/600',
    imageAlt: 'Viral dance moment',
    publishedAt: hoursAgo(2),
    readTimeMinutes: 4,
    category: { id: 'entertainment', name: 'Entertainment', slug: 'entertainment' },
    author: genzAuthors[1],
    reactions: { fire: 2345, laugh: 123, wow: 678, hundred: 890, heart: 1234 },
    tags: ['viral', 'entertainment', 'trending'],
  },
  {
    id: 'gz3',
    slug: 'gen-alpha-slang-guide',
    title: 'Gen Alpha Slang is Getting Unhinged - A Survival Guide 📖',
    excerpt: 'Skibidi toilet? Rizz? We decode what the kids are saying.',
    imageUrl: 'https://picsum.photos/seed/genz3/800/600',
    imageAlt: 'Generation Alpha kids',
    publishedAt: hoursAgo(3),
    readTimeMinutes: 5,
    category: { id: 'lifestyle', name: 'Lifestyle', slug: 'lifestyle' },
    author: genzAuthors[2],
    reactions: { fire: 456, laugh: 2345, wow: 123, hundred: 567, heart: 234 },
    tags: ['trending', 'lifestyle', 'memes'],
  },
  {
    id: 'gz4',
    slug: 'new-iphone-features-leaked',
    title: 'iPhone 16 Leaks are WILD - Here\'s Everything We Know 📱',
    excerpt: 'New camera, new colors, and a feature nobody asked for.',
    imageUrl: 'https://picsum.photos/seed/genz4/800/600',
    imageAlt: 'iPhone concept design',
    publishedAt: hoursAgo(4),
    readTimeMinutes: 4,
    category: { id: 'tech', name: 'Tech', slug: 'technology' },
    author: genzAuthors[0],
    reactions: { fire: 890, laugh: 234, wow: 1567, hundred: 345, heart: 678 },
    tags: ['tech', 'viral'],
  },
  {
    id: 'gz5',
    slug: 'bollywood-actor-gaming-stream',
    title: 'This Bollywood Star\'s Gaming Stream Went Absolutely Viral 🎮',
    excerpt: 'Celebrity gaming streams are the new normal and we\'re here for it.',
    imageUrl: 'https://picsum.photos/seed/genz5/800/600',
    imageAlt: 'Gaming stream setup',
    publishedAt: hoursAgo(5),
    readTimeMinutes: 3,
    category: { id: 'entertainment', name: 'Entertainment', slug: 'entertainment' },
    author: genzAuthors[1],
    reactions: { fire: 3456, laugh: 890, wow: 567, hundred: 1234, heart: 2345 },
    tags: ['gaming', 'entertainment', 'viral'],
  },
  {
    id: 'gz6',
    slug: 'coffee-trend-taking-over',
    title: 'This Coffee Trend is Taking Over Instagram and It\'s Chaotic ☕',
    excerpt: 'Move over Dalgona, there\'s a new drink in town.',
    imageUrl: 'https://picsum.photos/seed/genz6/800/600',
    imageAlt: 'Trendy coffee drink',
    publishedAt: hoursAgo(6),
    readTimeMinutes: 2,
    category: { id: 'food', name: 'Food', slug: 'lifestyle' },
    author: genzAuthors[2],
    reactions: { fire: 567, laugh: 345, wow: 234, hundred: 678, heart: 1890 },
    tags: ['food', 'trending', 'viral'],
  },
  {
    id: 'gz7',
    slug: 'crypto-bro-loses-everything',
    title: 'Crypto Bro Lost Everything and His Thread is Going Viral 📉',
    excerpt: 'A cautionary tale about diamond hands and paper losses.',
    imageUrl: 'https://picsum.photos/seed/genz7/800/600',
    imageAlt: 'Crypto market chart',
    publishedAt: hoursAgo(7),
    readTimeMinutes: 5,
    category: { id: 'tech', name: 'Tech', slug: 'technology' },
    author: genzAuthors[0],
    reactions: { fire: 234, laugh: 4567, wow: 890, hundred: 123, heart: 345 },
    tags: ['tech', 'viral', 'memes'],
  },
  {
    id: 'gz8',
    slug: 'influencer-drama-explained',
    title: 'The Influencer Drama Everyone\'s Talking About - Explained 🍿',
    excerpt: 'We broke down the whole beef so you don\'t have to scroll for hours.',
    imageUrl: 'https://picsum.photos/seed/genz8/800/600',
    imageAlt: 'Social media drama',
    publishedAt: hoursAgo(8),
    readTimeMinutes: 6,
    category: { id: 'entertainment', name: 'Entertainment', slug: 'entertainment' },
    author: genzAuthors[1],
    reactions: { fire: 1678, laugh: 2345, wow: 567, hundred: 890, heart: 456 },
    tags: ['entertainment', 'trending', 'viral'],
  },
  {
    id: 'gz9',
    slug: 'budget-travel-hack-viral',
    title: 'This Budget Travel Hack is Actually Genius 🧳✈️',
    excerpt: 'How one person visited 5 countries for less than a domestic flight.',
    imageUrl: 'https://picsum.photos/seed/genz9/800/600',
    imageAlt: 'Travel destination',
    publishedAt: hoursAgo(9),
    readTimeMinutes: 4,
    category: { id: 'travel', name: 'Travel', slug: 'lifestyle' },
    author: genzAuthors[2],
    reactions: { fire: 2890, laugh: 123, wow: 1456, hundred: 2345, heart: 890 },
    tags: ['travel', 'viral', 'trending'],
  },
  {
    id: 'gz10',
    slug: 'ai-generated-music-chart',
    title: 'AI-Generated Song Just Hit #1 and Musicians are NOT Happy 🎵',
    excerpt: 'The music industry is about to change forever.',
    imageUrl: 'https://picsum.photos/seed/genz10/800/600',
    imageAlt: 'AI music visualization',
    publishedAt: hoursAgo(10),
    readTimeMinutes: 5,
    category: { id: 'music', name: 'Music', slug: 'entertainment' },
    author: genzAuthors[0],
    reactions: { fire: 890, laugh: 567, wow: 2345, hundred: 678, heart: 1234 },
    tags: ['music', 'tech', 'viral'],
  },
  {
    id: 'gz11',
    slug: 'college-student-startup-millions',
    title: 'College Dropout\'s Side Hustle Just Made Him a Millionaire 💰',
    excerpt: 'Started in a hostel room, now he\'s got VCs on speed dial.',
    imageUrl: 'https://picsum.photos/seed/genz11/800/600',
    imageAlt: 'Young entrepreneur',
    publishedAt: hoursAgo(11),
    readTimeMinutes: 6,
    category: { id: 'tech', name: 'Tech', slug: 'technology' },
    author: genzAuthors[1],
    reactions: { fire: 3456, laugh: 234, wow: 1890, hundred: 2567, heart: 890 },
    tags: ['tech', 'trending', 'viral'],
  },
  {
    id: 'gz12',
    slug: 'pet-influencer-brand-deal',
    title: 'This Cat Just Got a Brand Deal Worth More Than Your Salary 🐱',
    excerpt: 'Pet influencers are the new celebrities and we can\'t even be mad.',
    imageUrl: 'https://picsum.photos/seed/genz12/800/600',
    imageAlt: 'Famous cat',
    publishedAt: hoursAgo(12),
    readTimeMinutes: 3,
    category: { id: 'entertainment', name: 'Entertainment', slug: 'entertainment' },
    author: genzAuthors[2],
    reactions: { fire: 1234, laugh: 3456, wow: 678, hundred: 890, heart: 4567 },
    tags: ['entertainment', 'viral', 'memes'],
  },
];

export const getGenzArticles = (limit?: number): GenZArticle[] => {
  return limit ? genzArticles.slice(0, limit) : genzArticles;
};

export const getGenzArticleBySlug = (slug: string): GenZArticle | undefined => {
  return genzArticles.find((a) => a.slug === slug);
};
