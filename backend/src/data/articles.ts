import { Article, Author } from '../types';
import { categories, getCategoryBySlug } from './categories';

const authors: Author[] = [
  { id: '1', name: 'Priya Sharma', avatarUrl: 'https://picsum.photos/seed/author1/100/100' },
  { id: '2', name: 'Rahul Verma', avatarUrl: 'https://picsum.photos/seed/author2/100/100' },
  { id: '3', name: 'Anita Desai', avatarUrl: 'https://picsum.photos/seed/author3/100/100' },
  { id: '4', name: 'Vikram Singh', avatarUrl: 'https://picsum.photos/seed/author4/100/100' },
  { id: '5', name: 'Meera Patel', avatarUrl: 'https://picsum.photos/seed/author5/100/100' },
];

const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

export const articles: Article[] = [
  {
    id: '1',
    slug: 'major-economic-reforms-announced',
    title: 'Government Announces Major Economic Reforms to Boost Growth',
    excerpt: 'New policies aim to accelerate economic growth and create millions of jobs across key sectors including manufacturing and technology.',
    category: getCategoryBySlug('politics'),
    author: authors[0],
    imageUrl: 'https://picsum.photos/seed/article1/1200/800',
    imageAlt: 'Economic policy announcement',
    publishedAt: hoursAgo(1),
    readTimeMinutes: 8,
    isFeatured: true,
    isBreaking: true,
  },
  {
    id: '2',
    slug: 'cricket-team-wins-series',
    title: 'India Clinches Historic Series Victory Against Australia',
    excerpt: 'A dominant performance in the final match seals the series for the home team in front of a packed stadium.',
    category: getCategoryBySlug('sports'),
    author: authors[1],
    imageUrl: 'https://picsum.photos/seed/article2/1200/800',
    imageAlt: 'Cricket match celebration',
    publishedAt: hoursAgo(2),
    readTimeMinutes: 5,
  },
  {
    id: '3',
    slug: 'tech-startup-raises-funding',
    title: 'Bangalore Startup Raises $500 Million in Record Funding Round',
    excerpt: 'The AI-focused company plans to expand operations globally and hire thousands of engineers.',
    category: getCategoryBySlug('technology'),
    author: authors[2],
    imageUrl: 'https://picsum.photos/seed/article3/1200/800',
    imageAlt: 'Startup office building',
    publishedAt: hoursAgo(3),
    readTimeMinutes: 4,
  },
  {
    id: '4',
    slug: 'monsoon-forecast-update',
    title: 'Weather Department Predicts Above Normal Monsoon This Year',
    excerpt: 'Farmers across the country welcome the news as agricultural sector prepares for bumper harvest.',
    category: getCategoryBySlug('india'),
    author: authors[3],
    imageUrl: 'https://picsum.photos/seed/article4/1200/800',
    imageAlt: 'Monsoon clouds over farmland',
    publishedAt: hoursAgo(4),
    readTimeMinutes: 3,
  },
  {
    id: '5',
    slug: 'new-film-breaks-records',
    title: 'Latest Bollywood Blockbuster Sets New Box Office Records',
    excerpt: 'The much-anticipated film crosses 500 crore mark in just two weeks of release.',
    category: getCategoryBySlug('entertainment'),
    author: authors[4],
    imageUrl: 'https://picsum.photos/seed/article5/1200/800',
    imageAlt: 'Movie premiere event',
    publishedAt: hoursAgo(5),
    readTimeMinutes: 4,
  },
  {
    id: '6',
    slug: 'stock-market-hits-high',
    title: 'Sensex Crosses 80,000 Mark for First Time in History',
    excerpt: 'Strong foreign investment and positive economic indicators drive market to new heights.',
    category: getCategoryBySlug('business'),
    author: authors[0],
    imageUrl: 'https://picsum.photos/seed/article6/1200/800',
    imageAlt: 'Stock market trading floor',
    publishedAt: hoursAgo(6),
    readTimeMinutes: 6,
  },
  {
    id: '7',
    slug: 'space-mission-success',
    title: 'ISRO Successfully Launches Next-Generation Satellite',
    excerpt: 'The satellite will enhance communication capabilities across rural areas.',
    category: getCategoryBySlug('technology'),
    author: authors[1],
    imageUrl: 'https://picsum.photos/seed/article7/1200/800',
    imageAlt: 'Rocket launch',
    publishedAt: hoursAgo(7),
    readTimeMinutes: 5,
  },
  {
    id: '8',
    slug: 'healthcare-initiative-launched',
    title: 'New Healthcare Initiative to Provide Free Treatment to Millions',
    excerpt: 'Government expands healthcare coverage to include more diseases under the scheme.',
    category: getCategoryBySlug('health'),
    author: authors[2],
    imageUrl: 'https://picsum.photos/seed/article8/1200/800',
    imageAlt: 'Hospital facility',
    publishedAt: hoursAgo(8),
    readTimeMinutes: 4,
  },
  {
    id: '9',
    slug: 'international-summit-begins',
    title: 'World Leaders Gather for Climate Summit in New Delhi',
    excerpt: 'Major announcements expected on renewable energy targets and carbon emission reductions.',
    category: getCategoryBySlug('world'),
    author: authors[3],
    imageUrl: 'https://picsum.photos/seed/article9/1200/800',
    imageAlt: 'International conference',
    publishedAt: hoursAgo(9),
    readTimeMinutes: 7,
  },
  {
    id: '10',
    slug: 'education-policy-changes',
    title: 'Major Changes Announced in National Education Policy',
    excerpt: 'New curriculum to focus on practical skills and digital literacy from primary school.',
    category: getCategoryBySlug('india'),
    author: authors[4],
    imageUrl: 'https://picsum.photos/seed/article10/1200/800',
    imageAlt: 'Students in classroom',
    publishedAt: hoursAgo(10),
    readTimeMinutes: 5,
  },
  {
    id: '11',
    slug: 'football-league-update',
    title: 'ISL Season Kicks Off with Exciting Opening Match',
    excerpt: 'Record attendance marks the beginning of a promising football season.',
    category: getCategoryBySlug('sports'),
    author: authors[0],
    imageUrl: 'https://picsum.photos/seed/article11/1200/800',
    imageAlt: 'Football stadium',
    publishedAt: hoursAgo(11),
    readTimeMinutes: 4,
  },
  {
    id: '12',
    slug: 'electric-vehicle-boom',
    title: 'Electric Vehicle Sales Surge as New Models Hit the Market',
    excerpt: 'Consumer interest in EVs reaches all-time high amid rising fuel prices.',
    category: getCategoryBySlug('business'),
    author: authors[1],
    imageUrl: 'https://picsum.photos/seed/article12/1200/800',
    imageAlt: 'Electric car showroom',
    publishedAt: hoursAgo(12),
    readTimeMinutes: 5,
  },
  {
    id: '13',
    slug: 'music-festival-announced',
    title: "Asia's Biggest Music Festival Coming to Mumbai",
    excerpt: 'International and domestic artists to perform over three days next month.',
    category: getCategoryBySlug('entertainment'),
    author: authors[2],
    imageUrl: 'https://picsum.photos/seed/article13/1200/800',
    imageAlt: 'Music festival stage',
    publishedAt: hoursAgo(13),
    readTimeMinutes: 3,
  },
  {
    id: '14',
    slug: 'infrastructure-project-completed',
    title: 'Longest Highway Tunnel Opens for Public Use',
    excerpt: 'The engineering marvel reduces travel time between two major cities by four hours.',
    category: getCategoryBySlug('india'),
    author: authors[3],
    imageUrl: 'https://picsum.photos/seed/article14/1200/800',
    imageAlt: 'Highway tunnel entrance',
    publishedAt: hoursAgo(14),
    readTimeMinutes: 4,
  },
  {
    id: '15',
    slug: 'wellness-trends-2024',
    title: 'Top Wellness Trends Taking the Country by Storm',
    excerpt: 'From mindful eating to digital detox, here are the health trends defining this year.',
    category: getCategoryBySlug('lifestyle'),
    author: authors[4],
    imageUrl: 'https://picsum.photos/seed/article15/1200/800',
    imageAlt: 'Wellness and yoga',
    publishedAt: hoursAgo(15),
    readTimeMinutes: 6,
  },
];

export function getFeaturedArticle(): Article {
  return articles.find((a) => a.isFeatured) || articles[0];
}

export function getRelatedArticles(articleId: string, limit = 3): Article[] {
  return articles.filter((a) => a.id !== articleId).slice(0, limit);
}

export function getArticlesByCategory(categorySlug: string, limit = 5): Article[] {
  return articles
    .filter((a) => a.category.slug === categorySlug)
    .slice(0, limit);
}

export function getLatestArticles(limit = 10): Article[] {
  return [...articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getAllArticleSlugs(): string[] {
  return articles.map((a) => a.slug);
}
