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
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT
);

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

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

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
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE polls ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);

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
  created_at TIMESTAMP DEFAULT NOW()
);

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

-- Default admin (username: admin, password: admin123)
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$LzBfvfBH1ZtXifxB.uTyS.8NzRcND8Oy1lekgsobRB/TDmPVf.Ch2')
ON CONFLICT (username) DO NOTHING;
