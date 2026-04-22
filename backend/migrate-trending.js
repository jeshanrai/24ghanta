require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Creating trending_items table...');
  await client.query(`
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
  `);
  console.log('Table created.');

  const items = [
    { label: 'Breaking News', href: '/breaking', priority: 1, badge: 'LIVE' },
    { label: 'Elections 2024', href: '/category/politics', priority: 2, badge: null },
    { label: 'Cricket World Cup', href: '/category/sports', priority: 3, badge: null },
    { label: 'Stock Market', href: '/category/business', priority: 4, badge: null },
    { label: 'Weather Update', href: '/category/world', priority: 5, badge: null },
  ];

  for (const i of items) {
    await client.query(
      'INSERT INTO trending_items (label, href, priority, badge) VALUES ($1, $2, $3, $4)',
      [i.label, i.href, i.priority, i.badge]
    );
    console.log('  + ' + i.label);
  }

  console.log('Done!');
  await client.end();
})();
