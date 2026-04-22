import { Video } from '../types';
import { categories } from './categories';

const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

export const videos: Video[] = [
  { id: 'v1', slug: 'breaking-news-economic-reforms', title: 'Live: Finance Minister Announces Economic Package', description: 'Watch the full press conference on new economic measures.', thumbnailUrl: 'https://picsum.photos/seed/video1/800/450', durationSeconds: 1245, category: categories[2], publishedAt: hoursAgo(1), views: 125000, type: 'video' },
  { id: 'v2', slug: 'cricket-highlights-final', title: 'Match Highlights: India vs Australia Final', description: 'All the key moments from the thrilling final match.', thumbnailUrl: 'https://picsum.photos/seed/video2/800/450', durationSeconds: 680, category: categories[3], publishedAt: hoursAgo(3), views: 890000, type: 'video' },
  { id: 'v3', slug: 'tech-review-new-smartphone', title: 'Hands-On: Latest Flagship Smartphone Review', description: 'Our first impressions of the most anticipated phone of the year.', thumbnailUrl: 'https://picsum.photos/seed/video3/800/450', durationSeconds: 542, category: categories[6], publishedAt: hoursAgo(5), views: 234000, type: 'video' },
  { id: 'v4', slug: 'weather-update-monsoon', title: 'Weather Update: Monsoon Progress Report', description: 'Detailed analysis of monsoon patterns across different regions.', thumbnailUrl: 'https://picsum.photos/seed/video4/800/450', durationSeconds: 185, category: categories[1], publishedAt: hoursAgo(6), views: 45000, type: 'video' },
  { id: 'v5', slug: 'film-trailer-launch', title: 'Exclusive: New Action Film Trailer Launch Event', thumbnailUrl: 'https://picsum.photos/seed/video5/800/450', durationSeconds: 320, category: categories[4], publishedAt: hoursAgo(8), views: 567000, type: 'video' },
  { id: 'v6', slug: 'market-analysis-weekly', title: 'Weekly Market Analysis: What to Expect Next Week', thumbnailUrl: 'https://picsum.photos/seed/video6/800/450', durationSeconds: 890, category: categories[5], publishedAt: hoursAgo(10), views: 78000, type: 'video' },
  { id: 'v7', slug: 'health-tips-immunity', title: 'Doctor Explains: Boosting Immunity Naturally', thumbnailUrl: 'https://picsum.photos/seed/video7/800/450', durationSeconds: 445, category: categories[7], publishedAt: hoursAgo(12), views: 156000, type: 'video' },
  { id: 'v8', slug: 'space-mission-launch', title: 'Watch: Satellite Launch Live Coverage', thumbnailUrl: 'https://picsum.photos/seed/video8/800/450', durationSeconds: 2100, category: categories[6], publishedAt: hoursAgo(14), views: 345000, type: 'video' },
];

export const shortStories: Video[] = [
  { id: 's1', slug: 'short-news-update-1', title: 'PM addresses nation on Independence Day', thumbnailUrl: 'https://picsum.photos/seed/short1/400/600', durationSeconds: 45, category: categories[2], publishedAt: hoursAgo(1), type: 'video' },
  { id: 's2', slug: 'short-sports-update', title: 'Cricket team celebrates historic win', thumbnailUrl: 'https://picsum.photos/seed/short2/400/600', durationSeconds: 32, category: categories[3], publishedAt: hoursAgo(2), type: 'video' },
  { id: 's3', slug: 'short-weather-alert', title: 'Heavy rainfall expected in coastal areas', thumbnailUrl: 'https://picsum.photos/seed/short3/400/600', durationSeconds: 28, category: categories[1], publishedAt: hoursAgo(3), type: 'video' },
  { id: 's4', slug: 'short-tech-launch', title: 'New AI tool revolutionizes education', thumbnailUrl: 'https://picsum.photos/seed/short4/400/600', durationSeconds: 55, category: categories[6], publishedAt: hoursAgo(4), type: 'video' },
  { id: 's5', slug: 'short-entertainment-news', title: 'Celebrity wedding takes social media by storm', thumbnailUrl: 'https://picsum.photos/seed/short5/400/600', durationSeconds: 38, category: categories[4], publishedAt: hoursAgo(5), type: 'video' },
];

export function getLatestVideos(limit = 4): Video[] {
  return [...videos].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).slice(0, limit);
}

export function getShortStories(limit = 10): Video[] {
  return shortStories.slice(0, limit);
}
