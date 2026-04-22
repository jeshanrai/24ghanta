-- 24ghantanepal Database Schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT,
  -- SEO Fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT
);

-- Proper Tags table for SEO tag pages (e.g. /tag/politics)
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  -- SEO Fields for the tag's own page
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
  image_url TEXT NOT NULL,
  image_alt TEXT,
  published_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP,
  read_time_minutes INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT FALSE,
  is_breaking BOOLEAN DEFAULT FALSE,
  -- SEO Fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT
);

-- Join table for many-to-many relationship between articles and tags
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
  thumbnail_url TEXT NOT NULL,
  video_url TEXT,
  embed_url TEXT,
  duration_seconds INTEGER,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  published_at TIMESTAMP NOT NULL,
  views INTEGER DEFAULT 0,
  type TEXT DEFAULT 'video',
  -- SEO Fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT
);

-- Join table for many-to-many relationship between videos and tags
CREATE TABLE IF NOT EXISTS video_tags (
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, tag_id)
);

CREATE TABLE IF NOT EXISTS polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  total_votes INTEGER DEFAULT 0,
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS poll_options (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes INTEGER DEFAULT 0
);

-- Insert a default admin user (username: admin, password: admin123 - make sure to change it!)
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2a$10$wT0E.qE.P0V6K.6Z6T3mQO0G5Z8O.jE.mZ0K.wT0E.qE.P0V6K.6Z');
