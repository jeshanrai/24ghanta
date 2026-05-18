-- 24ghantanepal Database Schema (PostgreSQL)
-- 1. Create database:  createdb 24ghantanepal
-- 2. Run schema:       psql -d 24ghantanepal -f schema.sql

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  username TEXT UNIQUE,
  email TEXT,
  password_hash TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  can_publish BOOLEAN DEFAULT TRUE,
  can_create_articles BOOLEAN DEFAULT TRUE,
  can_create_videos BOOLEAN DEFAULT TRUE,
  can_delete_own BOOLEAN DEFAULT TRUE,
  can_feature_articles BOOLEAN DEFAULT FALSE,
  can_mark_breaking BOOLEAN DEFAULT FALSE,
  can_create_tags BOOLEAN DEFAULT TRUE,
  can_send_newsletter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Back-compat ALTERs for DBs created before the credential columns existed
ALTER TABLE authors ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT TRUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_create_articles BOOLEAN DEFAULT TRUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_create_videos BOOLEAN DEFAULT TRUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_delete_own BOOLEAN DEFAULT TRUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_feature_articles BOOLEAN DEFAULT FALSE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_mark_breaking BOOLEAN DEFAULT FALSE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_create_tags BOOLEAN DEFAULT TRUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS can_send_newsletter BOOLEAN DEFAULT FALSE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Unique constraint on username only if it doesn't exist yet
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'authors_username_key'
  ) THEN
    ALTER TABLE authors ADD CONSTRAINT authors_username_key UNIQUE (username);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT,
  parent_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT
);

-- Back-compat for DBs created before parent_id existed.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  meta_title TEXT,
  meta_description TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL DEFAULT '',
  image_alt TEXT DEFAULT '',
  published_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  read_time_minutes INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT FALSE,
  is_breaking BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  views INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT
);

-- Safe ALTER for databases created before display_order existed
ALTER TABLE articles ADD COLUMN IF NOT EXISTS display_order INTEGER;
CREATE INDEX IF NOT EXISTS idx_articles_display_order ON articles(display_order);

-- Optional gallery: array of { url, caption } objects rendered below the lead image.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_articles_gallery ON articles USING GIN (gallery) WHERE gallery != '[]'::jsonb;

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Many-to-many: an article's primary category lives on articles.category_id,
-- any *extra* categories live here. Public filters look at both, so an article
-- tagged with the leaf "Course" also surfaces under "University" and "Education".
CREATE TABLE IF NOT EXISTS article_categories (
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_article_categories_category ON article_categories(category_id);

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  embed_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
  published_at TIMESTAMP DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  type TEXT DEFAULT 'video',
  is_published BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT
);

ALTER TABLE videos ADD COLUMN IF NOT EXISTS display_order INTEGER;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_videos_author ON videos(author_id);

CREATE TABLE IF NOT EXISTS video_tags (
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, tag_id)
);

CREATE TABLE IF NOT EXISTS polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  image_url TEXT,
  total_votes INTEGER DEFAULT 0,
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0
);

ALTER TABLE polls ADD COLUMN IF NOT EXISTS image_url TEXT;
-- Back-compat for DBs created before display_order existed. Used by the public
-- slider to order multiple active polls (lower number = shown first).
ALTER TABLE polls ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_polls_active_order ON polls(is_active, display_order, id);

CREATE TABLE IF NOT EXISTS poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);

-- Server-side dedupe for anonymous voting. voter_key is a hash of IP + UA so
-- the same browser can't keep posting. Composite PK enforces one vote per
-- (poll, voter) without any application-level coordination.
CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  voter_key TEXT NOT NULL,
  option_id INTEGER REFERENCES poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (poll_id, voter_key)
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);

CREATE TABLE IF NOT EXISTS trending_items (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL DEFAULT '#',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  badge TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trending_active ON trending_items(is_active, priority);

-- Advertisements (managed in admin panel, served per placement slot)
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  placement TEXT NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'image',
  image_url TEXT,
  link_url TEXT,
  alt_text TEXT,
  html_content TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ads_placement_active ON ads(placement, is_active, priority DESC);

-- End-user accounts (site visitors, separate from admin_users)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  unsubscribe_token TEXT UNIQUE,
  last_emailed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Backfill columns for older DBs and a partial index that speeds up the
-- "active recipients with a token" query the digest sender uses on every run.
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS last_emailed_at TIMESTAMP;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_unsubscribe_token_key') THEN
    ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_unsubscribe_token_key UNIQUE (unsubscribe_token);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_newsletter_active
  ON newsletter_subscribers(id) WHERE is_active = TRUE AND unsubscribe_token IS NOT NULL;

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_unread ON contact_messages(is_read, created_at DESC);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Admin bootstrap is performed by seed-prod.ts using ADMIN_USERNAME / ADMIN_PASSWORD
-- environment variables. No default credentials are seeded by the schema itself.

-- Newsletter email settings (single row, id = 1). Holds the admin-configured
-- weekly schedule and curation mode for the digest.
CREATE TABLE IF NOT EXISTS email_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  weekly_digest_enabled BOOLEAN DEFAULT FALSE,
  weekly_digest_day_of_week SMALLINT DEFAULT 1, -- 0=Sun..6=Sat
  weekly_digest_hour SMALLINT DEFAULT 6,        -- 0..23 in Asia/Kathmandu
  digest_curation_mode TEXT DEFAULT 'auto',     -- 'auto' | 'manual'
  weekly_digest_last_sent_at TIMESTAMP,
  weekly_digest_last_sent_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bootstrap the single settings row (no-op if it already exists).
INSERT INTO email_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Manually-curated articles for the next digest (manual mode only).
-- Cleared after a successful send so the admin can build a fresh list each cycle.
CREATE TABLE IF NOT EXISTS newsletter_picks (
  article_id INTEGER PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_picks_order
  ON newsletter_picks(sort_order, added_at);

-- Media Library
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    checksum VARCHAR(64) UNIQUE NOT NULL,
    alt_text VARCHAR(255) DEFAULT '',
    caption TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_original_name ON media(original_name);
