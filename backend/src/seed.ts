import pool from './db';

const hoursAgo = (hours: number): string => {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};

interface ArticleSeed {
  slug: string;
  title: string;
  excerpt: string;
  cat: string;
  author: number;
  img: string;
  alt: string;
  hours: number;
  readTime: number;
  featured?: boolean;
  breaking?: boolean;
  tags?: string[];
}

interface VideoSeed {
  slug: string;
  title: string;
  desc?: string;
  thumb: string;
  dur: number;
  cat: string;
  views: number;
}

async function seedCategories(): Promise<Record<string, number>> {
  const cats = [
    { name: 'World', slug: 'world', color: '#c41d2f' },
    { name: 'India', slug: 'india', color: '#1d4ed8' },
    { name: 'Politics', slug: 'politics', color: '#7c3aed' },
    { name: 'Sports', slug: 'sports', color: '#059669' },
    { name: 'Entertainment', slug: 'entertainment', color: '#db2777' },
    { name: 'Business', slug: 'business', color: '#d97706' },
    { name: 'Technology', slug: 'technology', color: '#0891b2' },
    { name: 'Health', slug: 'health', color: '#16a34a' },
    { name: 'Lifestyle', slug: 'lifestyle', color: '#be185d' },
    { name: 'Science', slug: 'science', color: '#4f46e5' },
    { name: 'Gen Z', slug: 'genz', color: '#FF6B6B' },
  ];
  const ids: Record<string, number> = {};
  for (const c of cats) {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, color) VALUES ($1,$2,$3)
       ON CONFLICT (slug) DO UPDATE SET name=$1, color=$3
       RETURNING id, slug`,
      [c.name, c.slug, c.color]
    );
    ids[rows[0].slug] = rows[0].id;
  }
  return ids;
}

async function seedTags(): Promise<Record<string, number>> {
  const tags = [
    { name: 'Breaking News', slug: 'breaking-news' },
    { name: 'Trending', slug: 'trending' },
    { name: 'Exclusive', slug: 'exclusive' },
    { name: 'Live Update', slug: 'live-update' },
    { name: 'Analysis', slug: 'analysis' },
    { name: 'Opinion', slug: 'opinion' },
    { name: 'Nepal', slug: 'nepal' },
    { name: 'Economy', slug: 'economy' },
    { name: 'Cricket', slug: 'cricket' },
    { name: 'Bollywood', slug: 'bollywood' },
    { name: 'AI', slug: 'ai' },
    { name: 'Elections', slug: 'elections' },
  ];
  const ids: Record<string, number> = {};
  for (const t of tags) {
    const { rows } = await pool.query(
      `INSERT INTO tags (name, slug) VALUES ($1,$2)
       ON CONFLICT (slug) DO UPDATE SET name=$1
       RETURNING id, slug`,
      [t.name, t.slug]
    );
    ids[rows[0].slug] = rows[0].id;
  }
  return ids;
}

async function seedAuthors(): Promise<number[]> {
  const authors = [
    { name: 'Priya Sharma', avatar_url: 'https://picsum.photos/seed/author1/100/100' },
    { name: 'Rahul Verma', avatar_url: 'https://picsum.photos/seed/author2/100/100' },
    { name: 'Anita Desai', avatar_url: 'https://picsum.photos/seed/author3/100/100' },
    { name: 'Vikram Singh', avatar_url: 'https://picsum.photos/seed/author4/100/100' },
    { name: 'Meera Patel', avatar_url: 'https://picsum.photos/seed/author5/100/100' },
  ];
  const ids: number[] = [];
  for (const a of authors) {
    const existing = await pool.query('SELECT id FROM authors WHERE name = $1 LIMIT 1', [a.name]);
    if (existing.rows.length > 0) {
      ids.push(existing.rows[0].id);
      continue;
    }
    const { rows } = await pool.query(
      'INSERT INTO authors (name, avatar_url) VALUES ($1,$2) RETURNING id',
      [a.name, a.avatar_url]
    );
    ids.push(rows[0].id);
  }
  return ids;
}

async function seedArticles(
  catIds: Record<string, number>,
  tagIds: Record<string, number>,
  authorIds: number[]
): Promise<void> {
  const articles: ArticleSeed[] = [
    { slug: 'major-economic-reforms-announced', title: 'Government Announces Major Economic Reforms to Boost Growth', excerpt: 'New policies aim to accelerate economic growth and create millions of jobs across key sectors including manufacturing and technology.', cat: 'politics', author: 0, img: 'https://picsum.photos/seed/article1/1200/800', alt: 'Economic policy announcement', hours: 1, readTime: 8, featured: true, breaking: true, tags: ['breaking-news', 'economy', 'trending'] },
    { slug: 'cricket-team-wins-series', title: 'India Clinches Historic Series Victory Against Australia', excerpt: 'A dominant performance in the final match seals the series for the home team in front of a packed stadium.', cat: 'sports', author: 1, img: 'https://picsum.photos/seed/article2/1200/800', alt: 'Cricket match celebration', hours: 2, readTime: 5, tags: ['cricket', 'trending'] },
    { slug: 'tech-startup-raises-funding', title: 'Bangalore Startup Raises $500 Million in Record Funding Round', excerpt: 'The AI-focused company plans to expand operations globally and hire thousands of engineers.', cat: 'technology', author: 2, img: 'https://picsum.photos/seed/article3/1200/800', alt: 'Startup office building', hours: 3, readTime: 4, tags: ['ai', 'economy'] },
    { slug: 'monsoon-forecast-update', title: 'Weather Department Predicts Above Normal Monsoon This Year', excerpt: 'Farmers across the country welcome the news as agricultural sector prepares for bumper harvest.', cat: 'india', author: 3, img: 'https://picsum.photos/seed/article4/1200/800', alt: 'Monsoon clouds over farmland', hours: 4, readTime: 3, tags: ['live-update'] },
    { slug: 'new-film-breaks-records', title: 'Latest Bollywood Blockbuster Sets New Box Office Records', excerpt: 'The much-anticipated film crosses 500 crore mark in just two weeks of release.', cat: 'entertainment', author: 4, img: 'https://picsum.photos/seed/article5/1200/800', alt: 'Movie premiere event', hours: 5, readTime: 4, tags: ['bollywood', 'trending'] },
    { slug: 'stock-market-hits-high', title: 'Sensex Crosses 80,000 Mark for First Time in History', excerpt: 'Strong foreign investment and positive economic indicators drive market to new heights.', cat: 'business', author: 0, img: 'https://picsum.photos/seed/article6/1200/800', alt: 'Stock market trading floor', hours: 6, readTime: 6, tags: ['breaking-news', 'economy'] },
    { slug: 'space-mission-success', title: 'ISRO Successfully Launches Next-Generation Satellite', excerpt: 'The satellite will enhance communication capabilities across rural areas.', cat: 'technology', author: 1, img: 'https://picsum.photos/seed/article7/1200/800', alt: 'Rocket launch', hours: 7, readTime: 5, tags: ['exclusive'] },
    { slug: 'healthcare-initiative-launched', title: 'New Healthcare Initiative to Provide Free Treatment to Millions', excerpt: 'Government expands healthcare coverage to include more diseases under the scheme.', cat: 'health', author: 2, img: 'https://picsum.photos/seed/article8/1200/800', alt: 'Hospital facility', hours: 8, readTime: 4, tags: ['nepal'] },
    { slug: 'international-summit-begins', title: 'World Leaders Gather for Climate Summit in New Delhi', excerpt: 'Major announcements expected on renewable energy targets and carbon emission reductions.', cat: 'world', author: 3, img: 'https://picsum.photos/seed/article9/1200/800', alt: 'International conference', hours: 9, readTime: 7, tags: ['exclusive', 'analysis'] },
    { slug: 'education-policy-changes', title: 'Major Changes Announced in National Education Policy', excerpt: 'New curriculum to focus on practical skills and digital literacy from primary school.', cat: 'india', author: 4, img: 'https://picsum.photos/seed/article10/1200/800', alt: 'Students in classroom', hours: 10, readTime: 5, tags: ['analysis'] },
    { slug: 'football-league-update', title: 'ISL Season Kicks Off with Exciting Opening Match', excerpt: 'Record attendance marks the beginning of a promising football season.', cat: 'sports', author: 0, img: 'https://picsum.photos/seed/article11/1200/800', alt: 'Football stadium', hours: 11, readTime: 4, tags: ['trending'] },
    { slug: 'electric-vehicle-boom', title: 'Electric Vehicle Sales Surge as New Models Hit the Market', excerpt: 'Consumer interest in EVs reaches all-time high amid rising fuel prices.', cat: 'business', author: 1, img: 'https://picsum.photos/seed/article12/1200/800', alt: 'Electric car showroom', hours: 12, readTime: 5, tags: ['economy', 'analysis'] },
    { slug: 'music-festival-announced', title: "Asia's Biggest Music Festival Coming to Mumbai", excerpt: 'International and domestic artists to perform over three days next month.', cat: 'entertainment', author: 2, img: 'https://picsum.photos/seed/article13/1200/800', alt: 'Music festival stage', hours: 13, readTime: 3, tags: ['exclusive'] },
    { slug: 'infrastructure-project-completed', title: 'Longest Highway Tunnel Opens for Public Use', excerpt: 'The engineering marvel reduces travel time between two major cities by four hours.', cat: 'india', author: 3, img: 'https://picsum.photos/seed/article14/1200/800', alt: 'Highway tunnel entrance', hours: 14, readTime: 4, tags: ['nepal'] },
    { slug: 'wellness-trends-2024', title: 'Top Wellness Trends Taking the Country by Storm', excerpt: 'From mindful eating to digital detox, here are the health trends defining this year.', cat: 'lifestyle', author: 4, img: 'https://picsum.photos/seed/article15/1200/800', alt: 'Wellness and yoga', hours: 15, readTime: 6, tags: ['opinion'] },
  ];

  for (const a of articles) {
    const { rows } = await pool.query(
      `INSERT INTO articles
         (slug, title, excerpt, category_id, author_id, image_url, image_alt,
          published_at, read_time_minutes, is_featured, is_breaking, is_published, views)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12)
       ON CONFLICT (slug) DO UPDATE SET title=$2
       RETURNING id`,
      [
        a.slug, a.title, a.excerpt, catIds[a.cat], authorIds[a.author], a.img, a.alt,
        hoursAgo(a.hours), a.readTime, a.featured ?? false, a.breaking ?? false,
        Math.floor(Math.random() * 5000),
      ]
    );
    const artId = rows[0].id;
    if (a.tags) {
      for (const tagSlug of a.tags) {
        if (tagIds[tagSlug]) {
          await pool.query(
            'INSERT INTO article_tags (article_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
            [artId, tagIds[tagSlug]]
          );
        }
      }
    }
  }
}

async function seedVideos(catIds: Record<string, number>): Promise<void> {
  const vids: VideoSeed[] = [
    { slug: 'breaking-news-economic-reforms', title: 'Live: Finance Minister Announces Economic Package', desc: 'Watch the full press conference on new economic measures.', thumb: 'https://picsum.photos/seed/video1/800/450', dur: 1245, cat: 'politics', views: 125000 },
    { slug: 'cricket-highlights-final', title: 'Match Highlights: India vs Australia Final', desc: 'All the key moments from the thrilling final match.', thumb: 'https://picsum.photos/seed/video2/800/450', dur: 680, cat: 'sports', views: 890000 },
    { slug: 'tech-review-new-smartphone', title: 'Hands-On: Latest Flagship Smartphone Review', desc: 'Our first impressions of the most anticipated phone of the year.', thumb: 'https://picsum.photos/seed/video3/800/450', dur: 542, cat: 'technology', views: 234000 },
    { slug: 'weather-update-monsoon', title: 'Weather Update: Monsoon Progress Report', desc: 'Detailed analysis of monsoon patterns across different regions.', thumb: 'https://picsum.photos/seed/video4/800/450', dur: 185, cat: 'india', views: 45000 },
    { slug: 'film-trailer-launch', title: 'Exclusive: New Action Film Trailer Launch Event', thumb: 'https://picsum.photos/seed/video5/800/450', dur: 320, cat: 'entertainment', views: 567000 },
    { slug: 'market-analysis-weekly', title: 'Weekly Market Analysis: What to Expect Next Week', thumb: 'https://picsum.photos/seed/video6/800/450', dur: 890, cat: 'business', views: 78000 },
    { slug: 'health-tips-immunity', title: 'Doctor Explains: Boosting Immunity Naturally', thumb: 'https://picsum.photos/seed/video7/800/450', dur: 445, cat: 'health', views: 156000 },
    { slug: 'space-mission-launch', title: 'Watch: Satellite Launch Live Coverage', thumb: 'https://picsum.photos/seed/video8/800/450', dur: 2100, cat: 'technology', views: 345000 },
    { slug: 'short-news-update-1', title: 'PM addresses nation on Independence Day', thumb: 'https://picsum.photos/seed/short1/400/600', dur: 45, cat: 'politics', views: 0 },
    { slug: 'short-sports-update', title: 'Cricket team celebrates historic win', thumb: 'https://picsum.photos/seed/short2/400/600', dur: 32, cat: 'sports', views: 0 },
    { slug: 'short-weather-alert', title: 'Heavy rainfall expected in coastal areas', thumb: 'https://picsum.photos/seed/short3/400/600', dur: 28, cat: 'india', views: 0 },
    { slug: 'short-tech-launch', title: 'New AI tool revolutionizes education', thumb: 'https://picsum.photos/seed/short4/400/600', dur: 55, cat: 'technology', views: 0 },
    { slug: 'short-entertainment-news', title: 'Celebrity wedding takes social media by storm', thumb: 'https://picsum.photos/seed/short5/400/600', dur: 38, cat: 'entertainment', views: 0 },
  ];
  for (let i = 0; i < vids.length; i++) {
    const v = vids[i];
    await pool.query(
      `INSERT INTO videos
         (slug, title, description, thumbnail_url, duration_seconds, category_id,
          published_at, views, type, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'video',true)
       ON CONFLICT (slug) DO UPDATE SET title=$2`,
      [v.slug, v.title, v.desc ?? null, v.thumb, v.dur, catIds[v.cat], hoursAgo(i + 1), v.views]
    );
  }
}

async function seedPolls(): Promise<void> {
  const pollsData = [
    { question: 'Which issue matters most to you this election?', options: [{ text: 'Economy', votes: 1245 }, { text: 'Healthcare', votes: 892 }, { text: 'Education', votes: 654 }, { text: 'Infrastructure', votes: 423 }] },
    { question: 'How do you feel about the new traffic regulations?', options: [{ text: 'Supportive', votes: 567 }, { text: 'Against', votes: 834 }, { text: 'Need more info', votes: 321 }] },
    { question: 'Best local food destination?', options: [{ text: 'Street Food Markets', votes: 1456 }, { text: 'Traditional Restaurants', votes: 987 }, { text: 'Cafes & Bakeries', votes: 654 }, { text: 'Food Courts', votes: 234 }] },
  ];

  for (const p of pollsData) {
    const existing = await pool.query('SELECT id FROM polls WHERE question = $1 LIMIT 1', [p.question]);
    if (existing.rows.length > 0) continue;

    const totalVotes = p.options.reduce((s, o) => s + o.votes, 0);
    const { rows } = await pool.query(
      'INSERT INTO polls (question, total_votes, is_active) VALUES ($1,$2,true) RETURNING id',
      [p.question, totalVotes]
    );
    for (const o of p.options) {
      await pool.query(
        'INSERT INTO poll_options (poll_id, text, votes) VALUES ($1,$2,$3)',
        [rows[0].id, o.text, o.votes]
      );
    }
  }
}

async function seedTrending(): Promise<void> {
  const items = [
    { label: 'Breaking News', href: '/breaking', priority: 1, badge: 'LIVE' },
    { label: 'Breaking News', href: '/breaking', priority: 2, badge: 'LIVE' },
    { label: 'Politics', href: '/category/politics', priority: 3, badge: null },
    { label: 'Budget 2082/83', href: '/category/business', priority: 4, badge: null },
    { label: 'Cricket & Sports', href: '/category/sports', priority: 5, badge: null },
    { label: 'ACC Premier Cup', href: '/category/sports', priority: 6, badge: null },
    { label: 'Stock Market', href: '/category/business', priority: 7, badge: null },
    { label: 'Visit Nepal 2026', href: '/category/business', priority: 8, badge: null },
  ];
  for (const item of items) {
    // Delete existing with same label and priority to allow re-seeding with badges
    await pool.query(
      'DELETE FROM trending_items WHERE label = $1 AND priority = $2',
      [item.label, item.priority]
    );

    await pool.query(
      `INSERT INTO trending_items (label, href, priority, is_active, badge)
       VALUES ($1,$2,$3,TRUE,$4)`,
      [item.label, item.href, item.priority, item.badge]
    );
  }
}

async function seedAds(): Promise<void> {
  const ads = [
    {
      name: 'Himalayan Java — header leaderboard',
      placement: 'header_banner',
      ad_type: 'image',
      image_url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1456&h=180&fit=crop&q=80',
      link_url: 'https://example.com/sponsor/himalayan-java',
      alt_text: 'Himalayan Java — Premium Nepali coffee delivered nationwide',
      priority: 10,
      is_active: true
    },
    {
      name: 'Daraz Nepal — between sections leaderboard',
      placement: 'between_sections',
      ad_type: 'image',
      image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1456&h=180&fit=crop&q=80',
      link_url: 'https://example.com/sponsor/daraz',
      alt_text: 'Daraz Nepal — Big Days mega-sale, free delivery on orders above Rs 1,000',
      priority: 10,
      is_active: true
    },
    {
      name: 'NIC Asia Bank — hero sidebar',
      placement: 'hero_sidebar',
      ad_type: 'image',
      image_url: 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=600&h=500&fit=crop&q=80',
      link_url: 'https://example.com/sponsor/nic-asia',
      alt_text: 'NIC Asia Bank — Open a digital savings account in 5 minutes',
      priority: 10,
      is_active: true
    },
    {
      name: 'eSewa — article inline rectangle',
      placement: 'article_inline',
      ad_type: 'image',
      image_url: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=672&h=560&fit=crop&q=80',
      link_url: 'https://example.com/sponsor/esewa',
      alt_text: 'eSewa — Pay bills, recharge and shop without ever opening your wallet',
      priority: 10,
      is_active: true
    },
    {
      name: 'Buddha Air — article sidebar skyscraper',
      placement: 'article_sidebar',
      ad_type: 'image',
      image_url: 'https://images.unsplash.com/photo-1542296332-2e4473faf563?w=600&h=1200&fit=crop&q=80',
      link_url: 'https://example.com/sponsor/buddha-air',
      alt_text: 'Buddha Air — Daily flights to Pokhara, Bharatpur, Janakpur and more',
      priority: 10,
      is_active: true
    },
    {
      name: 'Ncell Postpaid — footer leaderboard',
      placement: 'footer_banner',
      ad_type: 'image',
      image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1456&h=180&fit=crop&q=80',
      link_url: 'https://example.com/sponsor/ncell',
      alt_text: 'Ncell Postpaid — Unlimited 5G data, free roaming across SAARC',
      priority: 10,
      is_active: true
    },
    {
      name: 'Visit Nepal 2026 — landing popup',
      placement: 'popup_landing',
      ad_type: 'image',
      image_url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=900&fit=crop&q=80',
      link_url: 'https://example.com/sponsor/visit-nepal-2026',
      alt_text: 'Visit Nepal 2026 — Plan your trip to the roof of the world',
      priority: 10,
      is_active: true
    }
  ];

  for (const ad of ads) {
    // Overwrite existing ads with the same placement to ensure they match seed-prod.sql
    await pool.query('DELETE FROM ads WHERE placement = $1', [ad.placement]);
    
    await pool.query(
      `INSERT INTO ads (name, placement, ad_type, image_url, link_url, alt_text, is_active, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ad.name, ad.placement, ad.ad_type, ad.image_url, ad.link_url, ad.alt_text, ad.is_active, ad.priority]
    );
  }
}

/**
 * Seeds the database only if it appears empty (no categories yet).
 * Safe to call on every server start.
 */
export async function seedIfEmpty(): Promise<void> {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM categories');
  if (rows[0].c > 0) {
    // If categories exist, still check if ads are missing and seed them
    await seedAds();
    return;
  }

  console.log('🌱 Database is empty — seeding initial data...');
  const catIds = await seedCategories();
  const tagIds = await seedTags();
  const authorIds = await seedAuthors();
  await seedArticles(catIds, tagIds, authorIds);
  await seedVideos(catIds);
  await seedPolls();
  await seedTrending();
  await seedAds();
  console.log('✅ Seed complete');
}
