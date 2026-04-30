-- ─────────────────────────────────────────────────────────────────────────────
-- 24Ghanta — Production seed data
-- ─────────────────────────────────────────────────────────────────────────────
-- USAGE
--   psql "$DATABASE_URL" -f seed-prod.sql
--   (or) paste into Neon / Supabase SQL editor and run
--
-- IDEMPOTENT: every INSERT uses ON CONFLICT, so re-running the file will not
-- create duplicates. Updates a few editable fields (titles, prices, etc.) but
-- never overwrites your live operational state (impressions, votes, views).
--
-- DEFAULT CREDENTIALS — rotate via /admin after first login.
--   Admin:    admin           / Admin@2026
--   Authors:  <username>      / Welcome@2026
--
-- Requires the pgcrypto extension for bcrypt hashing of passwords (`crypt`,
-- `gen_salt`). Most managed Postgres providers (Neon, Supabase, Render) ship
-- this; it's enabled below.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ───────────────────────────── Admin user ───────────────────────────────────
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', crypt('Admin@2026', gen_salt('bf', 10)))
ON CONFLICT (username) DO NOTHING;

-- ───────────────────────────── Categories ───────────────────────────────────
INSERT INTO categories (name, slug, color) VALUES
  ('Nepal',         'nepal',         '#dc2626'),
  ('World',         'world',         '#c41d2f'),
  ('Politics',      'politics',      '#7c3aed'),
  ('Business',      'business',      '#d97706'),
  ('Sports',        'sports',        '#059669'),
  ('Technology',    'technology',    '#0891b2'),
  ('Entertainment', 'entertainment', '#db2777'),
  ('Health',        'health',        '#16a34a'),
  ('Lifestyle',     'lifestyle',     '#be185d'),
  ('Opinion',       'opinion',       '#4f46e5'),
  ('Gen Z',         'genz',          '#FF6B6B')
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      color = EXCLUDED.color;

-- ───────────────────────────── Tags ─────────────────────────────────────────
INSERT INTO tags (name, slug) VALUES
  ('Breaking',     'breaking'),
  ('Live',         'live'),
  ('Exclusive',    'exclusive'),
  ('Analysis',     'analysis'),
  ('Opinion',      'opinion'),
  ('Kathmandu',    'kathmandu'),
  ('Federal Govt', 'federal'),
  ('Economy',      'economy'),
  ('Cricket',      'cricket'),
  ('Tourism',      'tourism'),
  ('Climate',      'climate'),
  ('Elections',    'elections')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- ───────────────────────────── Authors ──────────────────────────────────────
-- Same default password for every author; rotate from /admin/authors.
INSERT INTO authors
  (name, avatar_url, username, email, password_hash,
   is_active, can_publish, can_create_articles, can_create_videos, can_delete_own,
   can_feature_articles, can_mark_breaking, can_create_tags)
VALUES
  ('Sushma Karki',    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=sushma-karki&w=200&h=200&fit=crop&q=80',    'sushma.karki',    'sushma@24ghanta.com',    crypt('Welcome@2026', gen_salt('bf', 10)), TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,  TRUE,  TRUE),
  ('Ramesh Adhikari', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=ramesh-adhikari&w=200&h=200&fit=crop&q=80', 'ramesh.adhikari', 'ramesh@24ghanta.com',    crypt('Welcome@2026', gen_salt('bf', 10)), TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,  FALSE, TRUE),
  ('Anjali Shrestha', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=anjali-shrestha&w=200&h=200&fit=crop&q=80', 'anjali.shrestha', 'anjali@24ghanta.com',    crypt('Welcome@2026', gen_salt('bf', 10)), TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE),
  ('Bikash Tamang',   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=bikash-tamang&w=200&h=200&fit=crop&q=80',   'bikash.tamang',   'bikash@24ghanta.com',    crypt('Welcome@2026', gen_salt('bf', 10)), TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE),
  ('Nisha Pradhan',   'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=nisha-pradhan&w=200&h=200&fit=crop&q=80',   'nisha.pradhan',   'nisha@24ghanta.com',     crypt('Welcome@2026', gen_salt('bf', 10)), TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE),
  ('Saroj Bhattarai', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=saroj-bhattarai&w=200&h=200&fit=crop&q=80', 'saroj.bhattarai', 'saroj@24ghanta.com',     crypt('Welcome@2026', gen_salt('bf', 10)), TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE),
  ('Pooja Gurung',    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?seed=pooja-gurung&w=200&h=200&fit=crop&q=80',    'pooja.gurung',    'pooja@24ghanta.com',     crypt('Welcome@2026', gen_salt('bf', 10)), TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, TRUE)
ON CONFLICT (username) DO UPDATE
  SET name                 = EXCLUDED.name,
      email                = EXCLUDED.email,
      avatar_url           = EXCLUDED.avatar_url,
      can_feature_articles = EXCLUDED.can_feature_articles,
      can_mark_breaking    = EXCLUDED.can_mark_breaking;

-- ───────────────────────────── Articles ─────────────────────────────────────
-- Each article references categories.slug + authors.username for portability
-- across re-runs (no hard-coded ids).
WITH inserted_articles AS (
  INSERT INTO articles
    (slug, title, excerpt, content, category_id, author_id, image_url, image_alt,
     published_at, read_time_minutes, is_featured, is_breaking, is_published, views,
     meta_title, meta_description)
  SELECT
    a.slug, a.title, a.excerpt, a.content,
    c.id, au.id,
    'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?seed=' || a.img_seed || '&w=1200&h=800&fit=crop&q=80',
    a.image_alt,
    NOW() - (a.hours_ago || ' hours')::interval,
    a.read_time, a.is_featured, a.is_breaking, TRUE,
    a.views,
    a.title, a.excerpt
  FROM (VALUES
    ('budget-2082-key-takeaways',          'Budget 2082/83: Key takeaways for Nepali households and SMEs',          'The finance minister presented a Rs 18.6 trillion budget focused on tourism revival, hydropower, and digital infrastructure.', 'The finance minister today presented the federal budget of Rs 18.6 trillion. The focus is on hydropower, tourism revival and digital infrastructure. Officials say the proposals will move to the parliamentary finance committee next week. Civil-society groups have asked for clearer execution timelines. 24Ghanta will continue to update this story.', 'business',      'ramesh.adhikari', 'budget',     'Finance ministry building Kathmandu',  1,  7, TRUE,  TRUE,  6210),
    ('kathmandu-air-quality-action-plan',  'Kathmandu unveils five-year action plan to tackle hazardous air quality','Targeted EV adoption, brick-kiln modernisation and green-belt expansion form the core of the new plan.',         'Kathmandu Metropolitan City unveiled a five-year air-quality action plan today. The plan combines EV adoption incentives, brick-kiln modernisation and green-belt expansion. Independent reviewers welcomed the move but flagged enforcement as the open question.', 'nepal',         'sushma.karki',    'air',        'Kathmandu skyline with smog',          3,  5, FALSE, FALSE, 4180),
    ('nepal-cricket-acc-cup-final',        'Nepal stuns Oman to reach ACC Premier Cup final',                       'Sandeep Lamichhane returns with a four-wicket haul as the Rhinos book a place in their first continental final since 2018.', 'Nepal beat Oman by 32 runs in the semi-final to book a place in the ACC Premier Cup final. Sandeep Lamichhane took four wickets on his return.', 'sports',        'bikash.tamang',   'cricket',    'Cricket players celebrating',          2,  4, FALSE, TRUE,  9120),
    ('visit-nepal-2026-launch',            'Visit Nepal 2026 campaign formally launched in Kathmandu',              'Tourism Board targets 2 million visitors in the campaign year, banking on adventure tourism and revived MICE travel.', 'Visit Nepal 2026 was formally launched today at Hotel Yak & Yeti. The Tourism Board is targeting 2 million visitors. The launch event was attended by trekking operators, MICE planners and provincial tourism boards.', 'business',      'ramesh.adhikari', 'tourism',    'Mountain trek in Nepal',               5,  6, TRUE,  FALSE, 3420),
    ('rupee-dollar-rate-22-week-high',     'Nepali rupee touches 22-week high against the US dollar',               'Remittance inflows and tighter monetary policy from the Indian central bank are driving the appreciation.', 'The NPR closed at 132.18 to the USD on Tuesday — its strongest level in 22 weeks. Analysts attribute the move to remittance inflows and the RBI’s tighter stance.', 'business',      'ramesh.adhikari', 'rupee',      'Currency exchange display',            6,  4, FALSE, FALSE, 2780),
    ('cop30-nepal-delegation',             'Nepal heads to COP30 with sharper climate-finance demands',             'The delegation will press developed economies for predictable, grant-based loss-and-damage funding for Himalayan nations.', 'Nepal’s COP30 delegation departs for Belém next week. The team will demand grant-based loss-and-damage funding for Himalayan nations, building on the Sharm el-Sheikh outcome.', 'world',         'anjali.shrestha', 'cop30',      'Climate conference hall',              8,  6, FALSE, FALSE, 1980),
    ('ai-startup-kathmandu-series-a',      'Kathmandu-based AI startup raises $4.2M Series A led by Sequoia SEA',   'Fusemachines spin-off Sahaayak.ai will use the funds to expand its on-prem document-AI platform across South Asia.', 'Sahaayak.ai today closed a $4.2M Series A round led by Sequoia Southeast Asia. Funds will go towards expanding the on-prem document-AI platform across South Asia.', 'technology',    'nisha.pradhan',   'startup',    'Office workspace with developers',     9,  5, TRUE,  FALSE, 5410),
    ('parliament-citizenship-amendment',   'Parliament passes amendment streamlining citizenship-by-descent process','The bill, debated for over a year, now moves to the President for assent.',                                'Parliament today passed the long-debated citizenship amendment with 198 votes in favour. The bill now moves to the President for assent.', 'politics',      'sushma.karki',    'parliament', 'Federal parliament hall',             11,  5, FALSE, FALSE, 3120),
    ('kathmandu-metro-feasibility-report', 'Kathmandu metro feasibility report flags Rs 320B price tag',            'JICA-funded study recommends a phased BRT-first approach before any heavy-rail commitment.',                  'JICA submitted its feasibility study this morning. The report flags a Rs 320 billion price tag and recommends a phased BRT-first approach before any heavy-rail commitment.', 'nepal',         'sushma.karki',    'metro',      'Urban transport rendering',           13,  7, FALSE, FALSE, 2210),
    ('movie-prem-geet-4-tops-charts',      '"Prem Geet 4" tops Nepali box office in opening weekend',               'Director Santosh Sen’s romantic drama collects an estimated Rs 6.4 crore across three days.',                'Director Santosh Sen’s "Prem Geet 4" opened to a record weekend, collecting an estimated Rs 6.4 crore over three days, distributors said.', 'entertainment', 'saroj.bhattarai', 'cinema',     'Cinema hall premiere',                14,  3, FALSE, FALSE, 4870),
    ('dengue-cases-rise-terai',            'Dengue cases climb across Terai districts as monsoon prolongs',         'Health authorities issue advisory; 1,420 confirmed cases in the past four weeks.',                            'Confirmed dengue cases reached 1,420 in the past four weeks across Terai districts. The Ministry of Health issued an advisory urging fogging and source reduction.', 'health',        'pooja.gurung',    'health',     'Hospital ward',                       16,  4, FALSE, TRUE,  2980),
    ('india-nepal-trade-treaty-talks',     'India and Nepal resume bilateral trade-treaty talks after a year',      'Negotiators meet in New Delhi to discuss revised rules-of-origin and a digital-payments corridor.',          'Indian and Nepali trade negotiators resumed talks in New Delhi today. The agenda covers revised rules-of-origin and a bilateral digital-payments corridor.', 'world',         'anjali.shrestha', 'india',      'Diplomatic meeting',                  18,  6, FALSE, FALSE, 1620),
    ('electricity-export-bangladesh',      'Nepal exports first 40 MW of electricity to Bangladesh through Indian grid','A milestone trilateral arrangement that NEA hopes to scale to 200 MW by next year.',                       'NEA today exported the first 40 MW of electricity to Bangladesh, using the Indian grid as a wheeling corridor. NEA targets a 200 MW scale-up by next year.', 'business',      'ramesh.adhikari', 'energy',     'Electricity transmission tower',      20,  5, FALSE, FALSE, 3340),
    ('genz-fintech-survey',                'Survey: 73% of Nepali Gen Z prefer mobile wallets over cash',           'eSewa, Khalti, and IME Pay continue to dominate; cash-on-delivery share fell to 18%.',                       'A new fintech survey shows 73% of Nepali Gen Z prefer mobile wallets over cash. eSewa, Khalti and IME Pay continue to dominate the market.', 'genz',          'nisha.pradhan',   'fintech',    'Mobile payment screen',               22,  4, FALSE, FALSE, 2110),
    ('wellness-trends-yoga-tourism',       'Pokhara’s wellness retreats are quietly reshaping Nepali tourism',      'High-end yoga and ayurveda retreats now contribute an estimated 8% of Pokhara’s tourism revenue.',           'Pokhara’s wellness sector now accounts for an estimated 8% of the city’s tourism revenue, according to local hoteliers. The segment skews towards longer-stay, higher-yield travellers.', 'lifestyle',     'pooja.gurung',    'wellness',   'Yoga retreat overlooking lake',       26,  5, FALSE, FALSE, 1480),
    ('opinion-federalism-decade',          'Opinion: A decade of federalism — what worked, what didn’t',            'Ten years on, the federal structure has matured in some areas and stalled in others. A practitioner’s view.','It has been a decade since the new constitution was promulgated. The federal structure has matured in service delivery while stalling in inter-government finance. A practitioner’s view.', 'opinion',       'sushma.karki',    'opinion',    'Constitution document',               30,  8, FALSE, FALSE, 1290),
    ('sports-everest-marathon-2025',       'Everest Marathon 2025 sees record international participation',         'Runners from 41 countries took part this year, with three new course records.',                              'Runners from 41 countries took part in the Everest Marathon this year. Three new course records were set across the half- and full-marathon categories.', 'sports',        'bikash.tamang',   'marathon',   'Mountain runners',                    36,  4, FALSE, FALSE, 1980),
    ('tech-nepal-data-protection-rules',   'Government finalises Data Protection Rules under Personal Information Act','Rules require explicit consent, breach notification within 72 hours, and a Data Protection Officer for large processors.','The cabinet today finalised Data Protection Rules under the Personal Information Act. The rules require explicit consent, 72-hour breach notification and a designated DPO for large processors.', 'technology',    'nisha.pradhan',   'privacy',    'Data privacy concept',                40,  6, FALSE, FALSE, 2740)
  ) AS a(slug, title, excerpt, content, category_slug, author_username, img_seed, image_alt, hours_ago, read_time, is_featured, is_breaking, views)
  JOIN categories c ON c.slug = a.category_slug
  JOIN authors    au ON au.username = a.author_username
  ON CONFLICT (slug) DO UPDATE
    SET title       = EXCLUDED.title,
        excerpt     = EXCLUDED.excerpt,
        content     = EXCLUDED.content,
        image_url   = EXCLUDED.image_url,
        is_featured = EXCLUDED.is_featured,
        is_breaking = EXCLUDED.is_breaking,
        updated_at  = NOW()
  RETURNING id, slug
)
-- Article ↔ Tag associations (also derived through slug joins for safety)
INSERT INTO article_tags (article_id, tag_id)
SELECT ia.id, t.id
FROM inserted_articles ia
JOIN (VALUES
  ('budget-2082-key-takeaways',          'breaking'),
  ('budget-2082-key-takeaways',          'economy'),
  ('budget-2082-key-takeaways',          'federal'),
  ('kathmandu-air-quality-action-plan',  'kathmandu'),
  ('kathmandu-air-quality-action-plan',  'climate'),
  ('kathmandu-air-quality-action-plan',  'analysis'),
  ('nepal-cricket-acc-cup-final',        'cricket'),
  ('nepal-cricket-acc-cup-final',        'breaking'),
  ('visit-nepal-2026-launch',            'tourism'),
  ('visit-nepal-2026-launch',            'economy'),
  ('rupee-dollar-rate-22-week-high',     'economy'),
  ('rupee-dollar-rate-22-week-high',     'analysis'),
  ('cop30-nepal-delegation',             'climate'),
  ('cop30-nepal-delegation',             'analysis'),
  ('cop30-nepal-delegation',             'exclusive'),
  ('ai-startup-kathmandu-series-a',      'economy'),
  ('ai-startup-kathmandu-series-a',      'exclusive'),
  ('parliament-citizenship-amendment',   'federal'),
  ('parliament-citizenship-amendment',   'analysis'),
  ('kathmandu-metro-feasibility-report', 'kathmandu'),
  ('kathmandu-metro-feasibility-report', 'analysis'),
  ('movie-prem-geet-4-tops-charts',      'exclusive'),
  ('dengue-cases-rise-terai',            'breaking'),
  ('dengue-cases-rise-terai',            'live'),
  ('india-nepal-trade-treaty-talks',     'economy'),
  ('electricity-export-bangladesh',      'economy'),
  ('electricity-export-bangladesh',      'exclusive'),
  ('genz-fintech-survey',                'analysis'),
  ('wellness-trends-yoga-tourism',       'tourism'),
  ('opinion-federalism-decade',          'opinion'),
  ('opinion-federalism-decade',          'analysis'),
  ('sports-everest-marathon-2025',       'tourism'),
  ('tech-nepal-data-protection-rules',   'analysis'),
  ('tech-nepal-data-protection-rules',   'exclusive')
) AS at(article_slug, tag_slug) ON at.article_slug = ia.slug
JOIN tags t ON t.slug = at.tag_slug
ON CONFLICT DO NOTHING;

-- ───────────────────────────── Videos ───────────────────────────────────────
INSERT INTO videos
  (slug, title, description, thumbnail_url, duration_seconds, category_id, author_id,
   published_at, views, type, is_published)
SELECT
  v.slug, v.title, v.description,
  'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?seed=' || v.thumb_seed || '&w=800&h=450&fit=crop&q=80',
  v.duration_seconds, c.id, au.id,
  NOW() - (v.hours_ago || ' hours')::interval,
  v.views,
  CASE WHEN v.duration_seconds < 90 THEN 'short' ELSE 'video' END,
  TRUE
FROM (VALUES
  ('live-budget-press-conference',    'LIVE: Finance Minister presents Budget 2082/83',                'Full press conference and key announcements.',                                  'video-budget',  1845, 'business',      'ramesh.adhikari', 2,  132450),
  ('highlights-nepal-vs-oman',        'Highlights: Nepal vs Oman — ACC Premier Cup semi-final',        'All wickets, fours and sixes from the historic win.',                            'video-cricket', 612,  'sports',        'bikash.tamang',   3,  854320),
  ('visit-nepal-2026-trailer',        'Visit Nepal 2026: Official campaign trailer',                   'A four-minute look at Nepal’s biggest tourism push of the decade.',              'video-tourism', 240,  'business',      'ramesh.adhikari', 4,  412000),
  ('kathmandu-air-quality-explainer', 'Why Kathmandu’s air gets worse every winter — explained',       'A 6-minute explainer on inversion layers, brick kilns and traffic.',             'video-air',     380,  'nepal',         'sushma.karki',    5,  68900 ),
  ('sahaayak-ai-founders-interview',  'Founders of Sahaayak.ai on raising $4.2M from Sequoia SEA',     'Exclusive sit-down with the founders.',                                          'video-startup', 1120, 'technology',    'nisha.pradhan',   6,  51200 ),
  ('prem-geet-4-trailer-launch',      'Prem Geet 4 — Trailer launch event highlights',                 'Highlights from the Mumbai launch event.',                                       'video-cinema',  285,  'entertainment', 'saroj.bhattarai', 7,  245800),
  ('short-rupee-22-week-high',        'NPR strongest in 22 weeks — what changed?',                     NULL,                                                                              'short-rupee',   48,   'business',      'ramesh.adhikari', 8,  15400 ),
  ('short-cricket-final-spot',        'Nepal in the ACC Premier Cup final',                            NULL,                                                                              'short-cricket', 32,   'sports',        'bikash.tamang',   9,  92100 )
) AS v(slug, title, description, thumb_seed, duration_seconds, category_slug, author_username, hours_ago, views)
JOIN categories c  ON c.slug = v.category_slug
JOIN authors    au ON au.username = v.author_username
ON CONFLICT (slug) DO UPDATE
  SET title         = EXCLUDED.title,
      description   = EXCLUDED.description,
      thumbnail_url = EXCLUDED.thumbnail_url;

-- ───────────────────────────── Polls ────────────────────────────────────────
WITH new_polls AS (
  INSERT INTO polls (question, total_votes, is_active)
  VALUES
    ('Which budget priority should the government focus on most?',                          6881, TRUE),
    ('Should Kathmandu pause all new construction permits while the metro feasibility is studied?', 3609, FALSE),
    ('Will Nepal win the ACC Premier Cup final?',                                            8304, FALSE)
  ON CONFLICT DO NOTHING
  RETURNING id, question
)
INSERT INTO poll_options (poll_id, text, votes)
SELECT np.id, o.text, o.votes
FROM new_polls np
JOIN (VALUES
  ('Which budget priority should the government focus on most?',                          'Tourism revival',          1842),
  ('Which budget priority should the government focus on most?',                          'Hydropower & energy',      2310),
  ('Which budget priority should the government focus on most?',                          'Education & jobs',         1605),
  ('Which budget priority should the government focus on most?',                          'Healthcare',               1124),
  ('Should Kathmandu pause all new construction permits while the metro feasibility is studied?', 'Yes, pause now',     1456),
  ('Should Kathmandu pause all new construction permits while the metro feasibility is studied?', 'No, that hurts the economy', 920),
  ('Should Kathmandu pause all new construction permits while the metro feasibility is studied?', 'Pause selectively',  1233),
  ('Will Nepal win the ACC Premier Cup final?',                                            'Yes — easy',              4120),
  ('Will Nepal win the ACC Premier Cup final?',                                            'Yes — close one',         3290),
  ('Will Nepal win the ACC Premier Cup final?',                                            'No, but a brave loss',     894)
) AS o(question, text, votes) ON o.question = np.question;

-- ───────────────────────────── Trending bar ─────────────────────────────────
INSERT INTO trending_items (label, href, priority, is_active, badge) VALUES
  ('Breaking News',     '/breaking',          1, TRUE, 'LIVE'),
  ('Budget 2082/83',    '/category/business', 2, TRUE, NULL),
  ('ACC Premier Cup',   '/category/sports',   3, TRUE, NULL),
  ('Visit Nepal 2026',  '/category/business', 4, TRUE, NULL),
  ('Kathmandu Air',     '/category/nepal',    5, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- Defensive UPDATE (in case rows already existed with different priority/badge):
UPDATE trending_items SET href='/breaking',          priority=1, badge='LIVE', is_active=TRUE WHERE label='Breaking News';
UPDATE trending_items SET href='/category/business', priority=2, badge=NULL,    is_active=TRUE WHERE label='Budget 2082/83';
UPDATE trending_items SET href='/category/sports',   priority=3, badge=NULL,    is_active=TRUE WHERE label='ACC Premier Cup';
UPDATE trending_items SET href='/category/business', priority=4, badge=NULL,    is_active=TRUE WHERE label='Visit Nepal 2026';
UPDATE trending_items SET href='/category/nepal',    priority=5, badge=NULL,    is_active=TRUE WHERE label='Kathmandu Air';

-- ───────────────────────────── Ads (real demo creatives, ACTIVE) ────────────
-- Each placement gets one active banner sized correctly for that slot.
-- Image source: Unsplash CDN (already whitelisted in next.config.ts).
-- Replace these via /admin/ads with your real sponsor artwork before going live.
INSERT INTO ads (name, placement, ad_type, image_url, link_url, alt_text, html_content, is_active, priority)
VALUES
  ('Himalayan Java — header leaderboard',
     'header_banner', 'image',
     'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1456&h=180&fit=crop&q=80',
     'https://example.com/sponsor/himalayan-java',
     'Himalayan Java — Premium Nepali coffee delivered nationwide', NULL, TRUE, 10),

  ('Daraz Nepal — between sections leaderboard',
     'between_sections', 'image',
     'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1456&h=180&fit=crop&q=80',
     'https://example.com/sponsor/daraz',
     'Daraz Nepal — Big Days mega-sale, free delivery on orders above Rs 1,000', NULL, TRUE, 10),

  ('NIC Asia Bank — hero sidebar',
     'hero_sidebar', 'image',
     'https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=600&h=500&fit=crop&q=80',
     'https://example.com/sponsor/nic-asia',
     'NIC Asia Bank — Open a digital savings account in 5 minutes', NULL, TRUE, 10),

  ('eSewa — article inline rectangle',
     'article_inline', 'image',
     'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=672&h=560&fit=crop&q=80',
     'https://example.com/sponsor/esewa',
     'eSewa — Pay bills, recharge and shop without ever opening your wallet', NULL, TRUE, 10),

  ('Buddha Air — article sidebar skyscraper',
     'article_sidebar', 'image',
     'https://images.unsplash.com/photo-1542296332-2e4473faf563?w=600&h=1200&fit=crop&q=80',
     'https://example.com/sponsor/buddha-air',
     'Buddha Air — Daily flights to Pokhara, Bharatpur, Janakpur and more', NULL, TRUE, 10),

  ('Ncell Postpaid — footer leaderboard',
     'footer_banner', 'image',
     'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1456&h=180&fit=crop&q=80',
     'https://example.com/sponsor/ncell',
     'Ncell Postpaid — Unlimited 5G data, free roaming across SAARC', NULL, TRUE, 10),

  ('Visit Nepal 2026 — landing popup',
     'popup_landing', 'image',
     'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=900&fit=crop&q=80',
     'https://example.com/sponsor/visit-nepal-2026',
     'Visit Nepal 2026 — Plan your trip to the roof of the world', NULL, TRUE, 10)
ON CONFLICT DO NOTHING;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
--   • Admin login:   admin / Admin@2026
--   • Author logins: <username> / Welcome@2026
--                    (sushma.karki, ramesh.adhikari, anjali.shrestha,
--                     bikash.tamang, nisha.pradhan, saroj.bhattarai, pooja.gurung)
--   • All 7 ad placements seeded as INACTIVE — activate after uploading real
--     creative from /admin/ads.
-- Rotate every default password from /admin before going live.
-- ─────────────────────────────────────────────────────────────────────────────
