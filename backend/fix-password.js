const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();
    const hash = '$2b$10$LzBfvfBH1ZtXifxB.uTyS.8NzRcND8Oy1lekgsobRB/TDmPVf.Ch2';
    await client.query('UPDATE admin_users SET password_hash = $1 WHERE username = $2', [hash, 'admin']);
    console.log('Fixed DB password hash successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
