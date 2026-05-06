require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Updating trending items...');

  // Clear existing items to avoid confusion/duplicates
  await client.query('DELETE FROM trending_items');

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

  for (const i of items) {
    await client.query(
      'INSERT INTO trending_items (label, href, priority, badge, is_active) VALUES ($1, $2, $3, $4, TRUE)',
      [i.label, i.href, i.priority, i.badge]
    );
    console.log(`  + Added: ${i.label} ${i.badge ? `[${i.badge}]` : ''}`);
  }

  console.log('Successfully updated trending items.');
  await client.end();
})();
