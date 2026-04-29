/**
 * Production seed — runs explicitly via `npm run seed:prod`.
 * Idempotent: every INSERT uses ON CONFLICT so re-running never duplicates.
 *
 * What it creates:
 *   • 1 admin user            (env: ADMIN_USERNAME, ADMIN_PASSWORD)
 *   • 11 categories            (Nepal-focused taxonomy)
 *   • 12 tags
 *   • 7 authors                (each with login credentials + beat-appropriate permissions)
 *   • 18 articles              (real-style Nepali headlines, attributed to the right beat author)
 *   • 8 videos
 *   • 3 polls
 *   • 5 trending bar items
 *   • 5 ads                    (one per common placement, all inactive by default)
 *
 * IMPORTANT — the default author password is "Welcome@2026". Rotate every
 * author's password from /admin/authors after first deploy.
 */

import bcrypt from 'bcryptjs';
import pool from './db';

const DEFAULT_AUTHOR_PASSWORD = process.env.SEED_AUTHOR_PASSWORD || 'Welcome@2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@2026';

const hoursAgo = (hours: number): string => {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
};

// ───────────────────────────────────────────── Admin
async function seedAdmin(): Promise<void> {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  await pool.query(
    `INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)
     ON CONFLICT (username) DO NOTHING`,
    [ADMIN_USERNAME, hash]
  );
}

// ───────────────────────────────────────────── Categories
async function seedCategories(): Promise<Record<string, number>> {
  const cats = [
    { name: 'Nepal',         slug: 'nepal',         color: '#dc2626' },
    { name: 'World',         slug: 'world',         color: '#c41d2f' },
    { name: 'Politics',      slug: 'politics',      color: '#7c3aed' },
    { name: 'Business',      slug: 'business',      color: '#d97706' },
    { name: 'Sports',        slug: 'sports',        color: '#059669' },
    { name: 'Technology',    slug: 'technology',    color: '#0891b2' },
    { name: 'Entertainment', slug: 'entertainment', color: '#db2777' },
    { name: 'Health',        slug: 'health',        color: '#16a34a' },
    { name: 'Lifestyle',     slug: 'lifestyle',     color: '#be185d' },
    { name: 'Opinion',       slug: 'opinion',       color: '#4f46e5' },
    { name: 'Gen Z',         slug: 'genz',          color: '#FF6B6B' },
  ];
  const ids: Record<string, number> = {};
  for (const c of cats) {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, color) VALUES ($1,$2,$3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color
       RETURNING id, slug`,
      [c.name, c.slug, c.color]
    );
    ids[rows[0].slug] = rows[0].id;
  }
  return ids;
}

// ───────────────────────────────────────────── Tags
async function seedTags(): Promise<Record<string, number>> {
  const tags = [
    { name: 'Breaking',      slug: 'breaking' },
    { name: 'Live',          slug: 'live' },
    { name: 'Exclusive',     slug: 'exclusive' },
    { name: 'Analysis',      slug: 'analysis' },
    { name: 'Opinion',       slug: 'opinion' },
    { name: 'Kathmandu',     slug: 'kathmandu' },
    { name: 'Federal Govt',  slug: 'federal' },
    { name: 'Economy',       slug: 'economy' },
    { name: 'Cricket',       slug: 'cricket' },
    { name: 'Tourism',       slug: 'tourism' },
    { name: 'Climate',       slug: 'climate' },
    { name: 'Elections',     slug: 'elections' },
  ];
  const ids: Record<string, number> = {};
  for (const t of tags) {
    const { rows } = await pool.query(
      `INSERT INTO tags (name, slug) VALUES ($1,$2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, slug`,
      [t.name, t.slug]
    );
    ids[rows[0].slug] = rows[0].id;
  }
  return ids;
}

// ───────────────────────────────────────────── Authors
interface AuthorSeed {
  name: string;
  username: string;
  email: string;
  beat: string;
  avatarSeed: string;
  canFeature?: boolean;
  canBreaking?: boolean;
}

async function seedAuthors(): Promise<Record<string, number>> {
  const authors: AuthorSeed[] = [
    { name: 'Sushma Karki',    username: 'sushma.karki',    email: 'sushma@24ghanta.com',    beat: 'politics',      avatarSeed: 'sushma-karki',    canFeature: true, canBreaking: true },
    { name: 'Ramesh Adhikari', username: 'ramesh.adhikari', email: 'ramesh@24ghanta.com',    beat: 'business',      avatarSeed: 'ramesh-adhikari', canFeature: true },
    { name: 'Anjali Shrestha', username: 'anjali.shrestha', email: 'anjali@24ghanta.com',    beat: 'world',         avatarSeed: 'anjali-shrestha' },
    { name: 'Bikash Tamang',   username: 'bikash.tamang',   email: 'bikash@24ghanta.com',    beat: 'sports',        avatarSeed: 'bikash-tamang' },
    { name: 'Nisha Pradhan',   username: 'nisha.pradhan',   email: 'nisha@24ghanta.com',     beat: 'technology',    avatarSeed: 'nisha-pradhan' },
    { name: 'Saroj Bhattarai', username: 'saroj.bhattarai', email: 'saroj@24ghanta.com',     beat: 'entertainment', avatarSeed: 'saroj-bhattarai' },
    { name: 'Pooja Gurung',    username: 'pooja.gurung',    email: 'pooja@24ghanta.com',     beat: 'lifestyle',     avatarSeed: 'pooja-gurung' },
  ];

  const passwordHash = bcrypt.hashSync(DEFAULT_AUTHOR_PASSWORD, 10);
  const ids: Record<string, number> = {};

  for (const a of authors) {
    const avatarUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=${a.avatarSeed}&w=200&h=200&fit=crop&q=80`;
    const { rows } = await pool.query(
      `INSERT INTO authors
         (name, avatar_url, username, email, password_hash,
          is_active, can_publish, can_create_articles, can_create_videos, can_delete_own,
          can_feature_articles, can_mark_breaking, can_create_tags)
       VALUES ($1,$2,$3,$4,$5,TRUE,TRUE,TRUE,TRUE,TRUE,$6,$7,TRUE)
       ON CONFLICT (username) DO UPDATE
         SET name = EXCLUDED.name,
             email = EXCLUDED.email,
             avatar_url = EXCLUDED.avatar_url,
             can_feature_articles = EXCLUDED.can_feature_articles,
             can_mark_breaking = EXCLUDED.can_mark_breaking
       RETURNING id`,
      [
        a.name,
        avatarUrl,
        a.username,
        a.email,
        passwordHash,
        a.canFeature ?? false,
        a.canBreaking ?? false,
      ]
    );
    ids[a.beat] = rows[0].id;
  }
  return ids;
}

// ───────────────────────────────────────────── Articles
interface ArticleSeed {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cat: string;
  beat: string;
  imgSeed: string;
  alt: string;
  hours: number;
  readTime: number;
  featured?: boolean;
  breaking?: boolean;
  tags?: string[];
  metaDescription?: string;
}

const longParagraph = (topic: string) =>
  `Officials in Kathmandu have weighed in on the ${topic} development, calling for a measured response while assuring stakeholders that ` +
  `coordination across federal and provincial governments remains intact. Multiple sources familiar with the matter said the situation will be ` +
  `monitored closely over the coming weeks. Independent analysts urged transparency and timely public communication to avoid speculation. ` +
  `24Ghanta will continue to update this story as new information becomes available.`;

const buildContent = (lead: string, topic: string) =>
  `${lead}\n\n${longParagraph(topic)}\n\n` +
  `In a statement issued late Tuesday, the spokesperson confirmed that an internal review was already underway. Civil society groups have ` +
  `welcomed the move but called for the findings to be made public. Opposition lawmakers, meanwhile, demanded a parliamentary briefing.\n\n` +
  `The story is developing.`;

async function seedArticles(
  catIds: Record<string, number>,
  tagIds: Record<string, number>,
  authorIds: Record<string, number>
): Promise<void> {
  const articles: ArticleSeed[] = [
    { slug: 'budget-2082-key-takeaways', title: 'Budget 2082/83: Key takeaways for Nepali households and SMEs', excerpt: 'The finance minister presented a Rs 18.6 trillion budget focused on tourism revival, hydropower, and digital infrastructure.', content: buildContent('The finance minister presented a Rs 18.6 trillion budget today.', 'budget'), cat: 'business', beat: 'business', imgSeed: 'budget', alt: 'Finance ministry building Kathmandu', hours: 1, readTime: 7, featured: true, breaking: true, tags: ['breaking', 'economy', 'federal'], metaDescription: 'Detailed breakdown of Nepal’s 2082/83 federal budget.' },
    { slug: 'kathmandu-air-quality-action-plan', title: 'Kathmandu unveils five-year action plan to tackle hazardous air quality', excerpt: 'Targeted EV adoption, brick-kiln modernisation and green-belt expansion form the core of the new plan.', content: buildContent('A five-year air-quality action plan was unveiled today.', 'air quality'), cat: 'nepal', beat: 'politics', imgSeed: 'air', alt: 'Kathmandu skyline with smog', hours: 3, readTime: 5, tags: ['kathmandu', 'climate', 'analysis'] },
    { slug: 'nepal-cricket-acc-cup-final', title: 'Nepal stuns Oman to reach ACC Premier Cup final', excerpt: 'Sandeep Lamichhane returns with a four-wicket haul as the Rhinos book a place in their first continental final since 2018.', content: buildContent('Nepal beat Oman by 32 runs in the semi-final.', 'cricket'), cat: 'sports', beat: 'sports', imgSeed: 'cricket', alt: 'Cricket players celebrating', hours: 2, readTime: 4, breaking: true, tags: ['cricket', 'breaking'] },
    { slug: 'visit-nepal-2026-launch', title: 'Visit Nepal 2026 campaign formally launched in Kathmandu', excerpt: 'Tourism Board targets 2 million visitors in the campaign year, banking on adventure tourism and revived MICE travel.', content: buildContent('Visit Nepal 2026 was launched today at Hotel Yak & Yeti.', 'tourism'), cat: 'business', beat: 'business', imgSeed: 'tourism', alt: 'Mountain trek in Nepal', hours: 5, readTime: 6, featured: true, tags: ['tourism', 'economy'] },
    { slug: 'rupee-dollar-rate-22-week-high', title: 'Nepali rupee touches 22-week high against the US dollar', excerpt: 'Remittance inflows and tighter monetary policy from the Indian central bank are driving the appreciation.', content: buildContent('The NPR closed at 132.18 to the USD on Tuesday.', 'currency'), cat: 'business', beat: 'business', imgSeed: 'rupee', alt: 'Currency exchange display', hours: 6, readTime: 4, tags: ['economy', 'analysis'] },
    { slug: 'cop30-nepal-delegation', title: 'Nepal heads to COP30 with sharper climate-finance demands', excerpt: 'The delegation will press developed economies for predictable, grant-based loss-and-damage funding for Himalayan nations.', content: buildContent('Nepal’s COP30 delegation departs next week.', 'climate finance'), cat: 'world', beat: 'world', imgSeed: 'cop30', alt: 'Climate conference hall', hours: 8, readTime: 6, tags: ['climate', 'analysis', 'exclusive'] },
    { slug: 'ai-startup-kathmandu-series-a', title: 'Kathmandu-based AI startup raises $4.2M Series A led by Sequoia SEA', excerpt: 'Fusemachines spin-off Sahaayak.ai will use the funds to expand its on-prem document-AI platform across South Asia.', content: buildContent('Sahaayak.ai closed a $4.2M Series A round.', 'AI funding'), cat: 'technology', beat: 'technology', imgSeed: 'startup', alt: 'Office workspace with developers', hours: 9, readTime: 5, featured: true, tags: ['economy', 'exclusive'] },
    { slug: 'parliament-citizenship-amendment', title: 'Parliament passes amendment streamlining citizenship-by-descent process', excerpt: 'The bill, debated for over a year, now moves to the President for assent.', content: buildContent('The amendment passed with 198 votes in favour.', 'citizenship'), cat: 'politics', beat: 'politics', imgSeed: 'parliament', alt: 'Federal parliament hall', hours: 11, readTime: 5, tags: ['federal', 'analysis'] },
    { slug: 'kathmandu-metro-feasibility-report', title: 'Kathmandu metro feasibility report flags Rs 320B price tag', excerpt: 'JICA-funded study recommends a phased BRT-first approach before any heavy-rail commitment.', content: buildContent('JICA submitted its feasibility report this morning.', 'metro'), cat: 'nepal', beat: 'politics', imgSeed: 'metro', alt: 'Urban transport rendering', hours: 13, readTime: 7, tags: ['kathmandu', 'analysis'] },
    { slug: 'movie-prem-geet-4-tops-charts', title: '"Prem Geet 4" tops Nepali box office in opening weekend', excerpt: 'Director Santosh Sen’s romantic drama collects an estimated Rs 6.4 crore across three days.', content: buildContent('Prem Geet 4 had a record opening weekend.', 'cinema'), cat: 'entertainment', beat: 'entertainment', imgSeed: 'cinema', alt: 'Cinema hall premiere', hours: 14, readTime: 3, tags: ['exclusive'] },
    { slug: 'dengue-cases-rise-terai', title: 'Dengue cases climb across Terai districts as monsoon prolongs', excerpt: 'Health authorities issue advisory; 1,420 confirmed cases in the past four weeks.', content: buildContent('Confirmed dengue cases reached 1,420 this week.', 'public health'), cat: 'health', beat: 'lifestyle', imgSeed: 'health', alt: 'Hospital ward', hours: 16, readTime: 4, breaking: true, tags: ['breaking', 'live'] },
    { slug: 'india-nepal-trade-treaty-talks', title: 'India and Nepal resume bilateral trade-treaty talks after a year', excerpt: 'Negotiators meet in New Delhi to discuss revised rules-of-origin and a digital-payments corridor.', content: buildContent('Trade-treaty talks resumed in New Delhi today.', 'bilateral trade'), cat: 'world', beat: 'world', imgSeed: 'india', alt: 'Diplomatic meeting', hours: 18, readTime: 6, tags: ['economy'] },
    { slug: 'electricity-export-bangladesh', title: 'Nepal exports first 40 MW of electricity to Bangladesh through Indian grid', excerpt: 'A milestone trilateral arrangement that NEA hopes to scale to 200 MW by next year.', content: buildContent('NEA exported 40 MW to Bangladesh today.', 'energy'), cat: 'business', beat: 'business', imgSeed: 'energy', alt: 'Electricity transmission tower', hours: 20, readTime: 5, tags: ['economy', 'exclusive'] },
    { slug: 'genz-fintech-survey', title: 'Survey: 73% of Nepali Gen Z prefer mobile wallets over cash', excerpt: 'eSewa, Khalti, and IME Pay continue to dominate; cash-on-delivery share fell to 18%.', content: buildContent('A new fintech survey was published this morning.', 'fintech'), cat: 'genz', beat: 'technology', imgSeed: 'fintech', alt: 'Mobile payment screen', hours: 22, readTime: 4, tags: ['analysis'] },
    { slug: 'wellness-trends-yoga-tourism', title: 'Pokhara’s wellness retreats are quietly reshaping Nepali tourism', excerpt: 'High-end yoga and ayurveda retreats now contribute an estimated 8% of Pokhara’s tourism revenue.', content: buildContent('Pokhara’s wellness sector is booming.', 'tourism'), cat: 'lifestyle', beat: 'lifestyle', imgSeed: 'wellness', alt: 'Yoga retreat overlooking lake', hours: 26, readTime: 5, tags: ['tourism'] },
    { slug: 'opinion-federalism-decade', title: 'Opinion: A decade of federalism — what worked, what didn’t', excerpt: 'Ten years on, the federal structure has matured in some areas and stalled in others. A practitioner’s view.', content: buildContent('A decade has passed since the new constitution.', 'federalism'), cat: 'opinion', beat: 'politics', imgSeed: 'opinion', alt: 'Constitution document', hours: 30, readTime: 8, tags: ['opinion', 'analysis'] },
    { slug: 'sports-everest-marathon-2025', title: 'Everest Marathon 2025 sees record international participation', excerpt: 'Runners from 41 countries took part this year, with three new course records.', content: buildContent('The Everest Marathon concluded yesterday.', 'sports'), cat: 'sports', beat: 'sports', imgSeed: 'marathon', alt: 'Mountain runners', hours: 36, readTime: 4, tags: ['tourism'] },
    { slug: 'tech-nepal-data-protection-rules', title: 'Government finalises Data Protection Rules under Personal Information Act', excerpt: 'Rules require explicit consent, breach notification within 72 hours, and a Data Protection Officer for large processors.', content: buildContent('The rules were finalised at the cabinet meeting today.', 'data protection'), cat: 'technology', beat: 'technology', imgSeed: 'privacy', alt: 'Data privacy concept', hours: 40, readTime: 6, tags: ['analysis', 'exclusive'] },
  ];

  for (const a of articles) {
    const img = `https://images.unsplash.com/photo-1521295121783-8a321d551ad2?seed=${a.imgSeed}&w=1200&h=800&fit=crop&q=80`;
    const { rows } = await pool.query(
      `INSERT INTO articles
         (slug, title, excerpt, content, category_id, author_id, image_url, image_alt,
          published_at, read_time_minutes, is_featured, is_breaking, is_published, views,
          meta_title, meta_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,$13,$14,$15)
       ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title,
             excerpt = EXCLUDED.excerpt,
             content = EXCLUDED.content,
             image_url = EXCLUDED.image_url,
             is_featured = EXCLUDED.is_featured,
             is_breaking = EXCLUDED.is_breaking,
             updated_at = NOW()
       RETURNING id`,
      [
        a.slug, a.title, a.excerpt, a.content,
        catIds[a.cat], authorIds[a.beat] || authorIds.politics,
        img, a.alt,
        hoursAgo(a.hours), a.readTime, a.featured ?? false, a.breaking ?? false,
        Math.floor(800 + Math.random() * 12000),
        a.title,
        a.metaDescription || a.excerpt,
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

// ───────────────────────────────────────────── Videos
async function seedVideos(
  catIds: Record<string, number>,
  authorIds: Record<string, number>
): Promise<void> {
  const vids = [
    { slug: 'live-budget-press-conference',     title: 'LIVE: Finance Minister presents Budget 2082/83',                  desc: 'Full press conference and key announcements.',                            thumbSeed: 'video-budget',     dur: 1845, cat: 'business',      beat: 'business',      views: 132450 },
    { slug: 'highlights-nepal-vs-oman',         title: 'Highlights: Nepal vs Oman — ACC Premier Cup semi-final',          desc: 'All wickets, fours and sixes from the historic win.',                       thumbSeed: 'video-cricket',    dur: 612,  cat: 'sports',        beat: 'sports',        views: 854320 },
    { slug: 'visit-nepal-2026-trailer',         title: 'Visit Nepal 2026: Official campaign trailer',                     desc: 'A four-minute look at Nepal’s biggest tourism push of the decade.',          thumbSeed: 'video-tourism',    dur: 240,  cat: 'business',      beat: 'business',      views: 412000 },
    { slug: 'kathmandu-air-quality-explainer',  title: 'Why Kathmandu’s air gets worse every winter — explained',         desc: 'A 6-minute explainer on inversion layers, brick kilns and traffic.',         thumbSeed: 'video-air',        dur: 380,  cat: 'nepal',         beat: 'politics',      views: 68900 },
    { slug: 'sahaayak-ai-founders-interview',   title: 'Founders of Sahaayak.ai on raising $4.2M from Sequoia SEA',       desc: 'Exclusive sit-down with the founders.',                                      thumbSeed: 'video-startup',    dur: 1120, cat: 'technology',    beat: 'technology',    views: 51200 },
    { slug: 'prem-geet-4-trailer-launch',       title: 'Prem Geet 4 — Trailer launch event highlights',                   desc: 'Highlights from the Mumbai launch event.',                                  thumbSeed: 'video-cinema',     dur: 285,  cat: 'entertainment', beat: 'entertainment', views: 245800 },
    { slug: 'short-rupee-22-week-high',         title: 'NPR strongest in 22 weeks — what changed?',                       desc: undefined,                                                                    thumbSeed: 'short-rupee',      dur: 48,   cat: 'business',      beat: 'business',      views: 15400 },
    { slug: 'short-cricket-final-spot',         title: 'Nepal in the ACC Premier Cup final',                              desc: undefined,                                                                    thumbSeed: 'short-cricket',    dur: 32,   cat: 'sports',        beat: 'sports',        views: 92100 },
  ];

  for (let i = 0; i < vids.length; i++) {
    const v = vids[i];
    const thumb = `https://images.unsplash.com/photo-1521295121783-8a321d551ad2?seed=${v.thumbSeed}&w=800&h=450&fit=crop&q=80`;
    const type = v.dur < 90 ? 'short' : 'video';
    await pool.query(
      `INSERT INTO videos
         (slug, title, description, thumbnail_url, duration_seconds, category_id, author_id,
          published_at, views, type, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
       ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title,
             description = EXCLUDED.description,
             thumbnail_url = EXCLUDED.thumbnail_url`,
      [
        v.slug, v.title, v.desc ?? null, thumb,
        v.dur, catIds[v.cat], authorIds[v.beat] || null,
        hoursAgo(i + 2), v.views, type,
      ]
    );
  }
}

// ───────────────────────────────────────────── Polls
async function seedPolls(): Promise<void> {
  const pollsData = [
    {
      question: 'Which budget priority should the government focus on most?',
      options: [
        { text: 'Tourism revival', votes: 1842 },
        { text: 'Hydropower & energy', votes: 2310 },
        { text: 'Education & jobs', votes: 1605 },
        { text: 'Healthcare', votes: 1124 },
      ],
    },
    {
      question: 'Should Kathmandu pause all new construction permits while the metro feasibility is studied?',
      options: [
        { text: 'Yes, pause now', votes: 1456 },
        { text: 'No, that hurts the economy', votes: 920 },
        { text: 'Pause selectively', votes: 1233 },
      ],
    },
    {
      question: 'Will Nepal win the ACC Premier Cup final?',
      options: [
        { text: 'Yes — easy', votes: 4120 },
        { text: 'Yes — close one', votes: 3290 },
        { text: 'No, but a brave loss', votes: 894 },
      ],
    },
  ];

  for (const p of pollsData) {
    const existing = await pool.query('SELECT id FROM polls WHERE question = $1 LIMIT 1', [p.question]);
    if (existing.rows.length > 0) continue;

    const totalVotes = p.options.reduce((s, o) => s + o.votes, 0);
    const { rows } = await pool.query(
      `INSERT INTO polls (question, total_votes, is_active)
       VALUES ($1,$2, $3) RETURNING id`,
      [p.question, totalVotes, p === pollsData[0]]
    );
    for (const o of p.options) {
      await pool.query(
        'INSERT INTO poll_options (poll_id, text, votes) VALUES ($1,$2,$3)',
        [rows[0].id, o.text, o.votes]
      );
    }
  }
}

// ───────────────────────────────────────────── Trending Bar
async function seedTrending(): Promise<void> {
  const items = [
    { label: 'Breaking News',  href: '/breaking',           priority: 1, badge: 'LIVE' },
    { label: 'Budget 2082/83', href: '/category/business',  priority: 2, badge: null   },
    { label: 'ACC Premier Cup',href: '/category/sports',    priority: 3, badge: null   },
    { label: 'Visit Nepal 2026', href: '/category/business',priority: 4, badge: null   },
    { label: 'Kathmandu Air',  href: '/category/nepal',     priority: 5, badge: null   },
  ];
  for (const item of items) {
    const existing = await pool.query(
      'SELECT id FROM trending_items WHERE label = $1 LIMIT 1',
      [item.label]
    );
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE trending_items SET href=$2, priority=$3, badge=$4, is_active=TRUE WHERE label=$1`,
        [item.label, item.href, item.priority, item.badge]
      );
      continue;
    }
    await pool.query(
      `INSERT INTO trending_items (label, href, priority, is_active, badge)
       VALUES ($1,$2,$3,TRUE,$4)`,
      [item.label, item.href, item.priority, item.badge]
    );
  }
}

// ───────────────────────────────────────────── Ads
async function seedAds(): Promise<void> {
  // All ads are inserted INACTIVE so a fresh production deploy never serves
  // placeholder creatives by accident — admin activates after uploading the
  // real artwork from /admin/ads.
  const ads = [
    { name: 'Header leaderboard — placeholder',     placement: 'header_banner',     image_url: '/placeholder.svg', alt_text: 'Sponsored leaderboard banner', priority: 10 },
    { name: 'Between sections leaderboard — placeholder', placement: 'between_sections', image_url: '/placeholder.svg', alt_text: 'Sponsored leaderboard banner', priority: 10 },
    { name: 'Hero sidebar — placeholder',            placement: 'hero_sidebar',      image_url: '/placeholder.svg', alt_text: 'Sponsored sidebar banner', priority: 10 },
    { name: 'Article inline — placeholder',          placement: 'article_inline',    image_url: '/placeholder.svg', alt_text: 'Sponsored inline banner', priority: 10 },
    { name: 'Article sidebar — placeholder',         placement: 'article_sidebar',   image_url: '/placeholder.svg', alt_text: 'Sponsored sidebar banner', priority: 10 },
    { name: 'Footer leaderboard — placeholder',      placement: 'footer_banner',     image_url: '/placeholder.svg', alt_text: 'Sponsored footer banner', priority: 10 },
    { name: 'Landing popup — placeholder',           placement: 'popup_landing',     image_url: '/placeholder.svg', alt_text: 'Sponsored landing popup', priority: 10 },
  ];

  for (const ad of ads) {
    const existing = await pool.query(
      'SELECT id FROM ads WHERE name = $1 AND placement = $2 LIMIT 1',
      [ad.name, ad.placement]
    );
    if (existing.rows.length > 0) continue;

    await pool.query(
      `INSERT INTO ads
         (name, placement, ad_type, image_url, link_url, alt_text, html_content,
          is_active, priority)
       VALUES ($1,$2,'image',$3,NULL,$4,NULL,FALSE,$5)`,
      [ad.name, ad.placement, ad.image_url, ad.alt_text, ad.priority]
    );
  }
}

// ───────────────────────────────────────────── Runner
export async function runProductionSeed(): Promise<void> {
  console.log('🚀 Production seed starting…');

  await seedAdmin();
  console.log('  ✅ admin user');

  const catIds = await seedCategories();
  console.log(`  ✅ ${Object.keys(catIds).length} categories`);

  const tagIds = await seedTags();
  console.log(`  ✅ ${Object.keys(tagIds).length} tags`);

  const authorIds = await seedAuthors();
  console.log(`  ✅ ${Object.keys(authorIds).length} authors (default password: ${DEFAULT_AUTHOR_PASSWORD})`);

  await seedArticles(catIds, tagIds, authorIds);
  console.log('  ✅ articles');

  await seedVideos(catIds, authorIds);
  console.log('  ✅ videos');

  await seedPolls();
  console.log('  ✅ polls');

  await seedTrending();
  console.log('  ✅ trending bar');

  await seedAds();
  console.log('  ✅ ad placeholders (all inactive — activate after upload)');

  console.log('\n🎉 Production seed complete.');
  console.log(`   Admin login:  ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  console.log(`   Author login: <username>@24ghanta.com style usernames / ${DEFAULT_AUTHOR_PASSWORD}`);
  console.log('   Rotate every credential from the admin panel before going live.');
}

// Allow direct invocation: `node dist/seed-prod.js` or `ts-node-dev src/seed-prod.ts`
if (require.main === module) {
  runProductionSeed()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      pool.end().finally(() => process.exit(1));
    });
}
