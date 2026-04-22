require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

const hoursAgo = (hours) => {
  const d = new Date(); d.setHours(d.getHours() - hours); return d.toISOString();
};

async function seed() {
  await client.connect();
  console.log('Seeding database...\n');

  // --- Categories ---
  console.log('Seeding categories...');
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
  const catIds = {};
  for (const c of cats) {
    const { rows } = await client.query(
      'INSERT INTO categories (name, slug, color) VALUES ($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET name=$1, color=$3 RETURNING id, slug', [c.name, c.slug, c.color]
    );
    catIds[rows[0].slug] = rows[0].id;
    console.log(`  ✓ ${c.name}`);
  }

  // --- Tags ---
  console.log('\nSeeding tags...');
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
  const tagIds = {};
  for (const t of tags) {
    const { rows } = await client.query(
      'INSERT INTO tags (name, slug) VALUES ($1,$2) ON CONFLICT (slug) DO UPDATE SET name=$1 RETURNING id, slug', [t.name, t.slug]
    );
    tagIds[rows[0].slug] = rows[0].id;
    console.log(`  ✓ ${t.name}`);
  }

  // --- Authors ---
  console.log('\nSeeding authors...');
  const authors = [
    { name: 'Priya Sharma', avatar_url: 'https://picsum.photos/seed/author1/100/100' },
    { name: 'Rahul Verma', avatar_url: 'https://picsum.photos/seed/author2/100/100' },
    { name: 'Anita Desai', avatar_url: 'https://picsum.photos/seed/author3/100/100' },
    { name: 'Vikram Singh', avatar_url: 'https://picsum.photos/seed/author4/100/100' },
    { name: 'Meera Patel', avatar_url: 'https://picsum.photos/seed/author5/100/100' },
  ];
  const authorIds = [];
  for (const a of authors) {
    const { rows } = await client.query(
      'INSERT INTO authors (name, avatar_url) VALUES ($1,$2) RETURNING id', [a.name, a.avatar_url]
    );
    authorIds.push(rows[0].id);
    console.log(`  ✓ ${a.name}`);
  }

  // --- Articles ---
  console.log('\nSeeding articles...');
  const articles = [
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
    const { rows } = await client.query(
      `INSERT INTO articles (slug, title, excerpt, category_id, author_id, image_url, image_alt, published_at, read_time_minutes, is_featured, is_breaking, is_published, views)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12)
       ON CONFLICT (slug) DO UPDATE SET title=$2 RETURNING id`,
      [a.slug, a.title, a.excerpt, catIds[a.cat], authorIds[a.author], a.img, a.alt, hoursAgo(a.hours), a.readTime, a.featured || false, a.breaking || false, Math.floor(Math.random() * 5000)]
    );
    const artId = rows[0].id;
    if (a.tags) {
      for (const t of a.tags) {
        if (tagIds[t]) await client.query('INSERT INTO article_tags (article_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [artId, tagIds[t]]);
      }
    }
    console.log(`  ✓ ${a.title.substring(0, 50)}...`);
  }

  // --- Videos ---
  console.log('\nSeeding videos...');
  const vids = [
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
  for (const v of vids) {
    await client.query(
      `INSERT INTO videos (slug, title, description, thumbnail_url, duration_seconds, category_id, published_at, views, type, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'video',true)
       ON CONFLICT (slug) DO UPDATE SET title=$2`,
      [v.slug, v.title, v.desc || null, v.thumb, v.dur, catIds[v.cat], hoursAgo(vids.indexOf(v) + 1), v.views]
    );
    console.log(`  ✓ ${v.title.substring(0, 50)}...`);
  }

  // --- Polls ---
  console.log('\nSeeding polls...');
  const pollsData = [
    { question: 'Which issue matters most to you this election?', options: [{ text: 'Economy', votes: 1245 }, { text: 'Healthcare', votes: 892 }, { text: 'Education', votes: 654 }, { text: 'Infrastructure', votes: 423 }] },
    { question: 'How do you feel about the new traffic regulations?', options: [{ text: 'Supportive', votes: 567 }, { text: 'Against', votes: 834 }, { text: 'Need more info', votes: 321 }] },
    { question: 'Best local food destination?', options: [{ text: 'Street Food Markets', votes: 1456 }, { text: 'Traditional Restaurants', votes: 987 }, { text: 'Cafes & Bakeries', votes: 654 }, { text: 'Food Courts', votes: 234 }] },
  ];
  for (const p of pollsData) {
    const totalVotes = p.options.reduce((s, o) => s + o.votes, 0);
    const { rows } = await client.query('INSERT INTO polls (question, total_votes, is_active) VALUES ($1,$2,true) RETURNING id', [p.question, totalVotes]);
    for (const o of p.options) {
      await client.query('INSERT INTO poll_options (poll_id, text, votes) VALUES ($1,$2,$3)', [rows[0].id, o.text, o.votes]);
    }
    console.log(`  ✓ ${p.question.substring(0, 50)}...`);
  }

  console.log('\n✅ Seed complete!');
  await client.end();
}

seed().catch(e => { console.error('Seed failed:', e); client.end(); process.exit(1); });
