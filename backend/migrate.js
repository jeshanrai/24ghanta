require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  console.log('Running migrations...');

  const queries = [
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_title TEXT`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_description TEXT`,
    `ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_keywords TEXT`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS meta_title TEXT`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS meta_description TEXT`,
    `ALTER TABLE videos ADD COLUMN IF NOT EXISTS meta_keywords TEXT`,
    `ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_title TEXT`,
    `ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_description TEXT`,
    `ALTER TABLE categories ADD COLUMN IF NOT EXISTS meta_keywords TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published)`,
    `CREATE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`,
  ];

  for (const q of queries) {
    try { await client.query(q); console.log('  OK:', q.substring(0, 60)); }
    catch (e) { console.log('  SKIP:', e.message ? e.message.substring(0, 80) : e); }
  }

  console.log('Migrations done!');
  await client.end();
}

migrate();
