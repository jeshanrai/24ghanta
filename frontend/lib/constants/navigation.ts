import type { NavItem, TrendingTopic, FooterColumn } from '@/lib/types';

export const mainNavItems: NavItem[] = [
  { id: 'world', label: 'World', href: '/category/world' },
  { id: 'india', label: 'India', href: '/category/india' },
  { id: 'politics', label: 'Politics', href: '/category/politics' },
  { id: 'sports', label: 'Sports', href: '/category/sports' },
  { id: 'entertainment', label: 'Entertainment', href: '/category/entertainment' },
  { id: 'business', label: 'Business', href: '/category/business' },
  { id: 'technology', label: 'Technology', href: '/category/technology' },
  { id: 'health', label: 'Health', href: '/category/health' },
  { id: 'lifestyle', label: 'Lifestyle', href: '/category/lifestyle' },
];

export const trendingTopics: TrendingTopic[] = [
  { id: '1', label: 'Breaking News', href: '/breaking' },
  { id: '2', label: 'Politics', href: '/category/politics' },
  { id: '3', label: 'Cricket & Sports', href: '/category/sports' },
  { id: '4', label: 'Stock Market', href: '/category/business' },
  { id: '5', label: 'Tech Today', href: '/category/technology' },
];

export const footerColumns: FooterColumn[] = [
  {
    id: 'news',
    title: 'News',
    links: [
      { id: 'world', label: 'World', href: '/category/world' },
      { id: 'india', label: 'India', href: '/category/india' },
      { id: 'politics', label: 'Politics', href: '/category/politics' },
      { id: 'business', label: 'Business', href: '/category/business' },
      { id: 'technology', label: 'Technology', href: '/category/technology' },
    ],
  },
  {
    id: 'sports',
    title: 'Sports',
    links: [
      { id: 'sports', label: 'All Sports', href: '/category/sports' },
      { id: 'cricket', label: 'Cricket', href: '/category/sports' },
      { id: 'football', label: 'Football', href: '/category/sports' },
      { id: 'tennis', label: 'Tennis', href: '/category/sports' },
    ],
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    links: [
      { id: 'entertainment', label: 'All Entertainment', href: '/category/entertainment' },
      { id: 'bollywood', label: 'Bollywood', href: '/category/entertainment' },
      { id: 'hollywood', label: 'Hollywood', href: '/category/entertainment' },
      { id: 'music', label: 'Music', href: '/category/entertainment' },
    ],
  },
  {
    id: 'more',
    title: 'More',
    links: [
      { id: 'health', label: 'Health', href: '/category/health' },
      { id: 'lifestyle', label: 'Lifestyle', href: '/category/lifestyle' },
      { id: 'about', label: 'About Us', href: '/about' },
    ],
  },
];
