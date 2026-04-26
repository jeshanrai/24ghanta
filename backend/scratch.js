const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:jeshan@localhost:5432/24ghantanepal',
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT 'articles' as table, id, title, image_url as src FROM articles WHERE image_url LIKE '%sadasd%'
    UNION
    SELECT 'authors' as table, id, name, avatar_url as src FROM authors WHERE avatar_url LIKE '%sadasd%'
    UNION
    SELECT 'videos' as table, id, title, thumbnail_url as src FROM videos WHERE thumbnail_url LIKE '%sadasd%'
  `);
  console.log(res.rows);
  
  // Actually let's delete or fix it right away
  await client.query(`UPDATE articles SET image_url = '/placeholder.jpg' WHERE image_url LIKE '%sadasd%'`);
  await client.end();
}
run().catch(console.error);
