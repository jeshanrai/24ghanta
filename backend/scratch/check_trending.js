require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log('Checking trending_items...');
  const { rows } = await client.query('SELECT * FROM trending_items ORDER BY priority ASC');
  console.log(JSON.stringify(rows, null, 2));

  await client.end();
})();
