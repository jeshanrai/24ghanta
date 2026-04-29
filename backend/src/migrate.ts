import fs from 'fs';
import path from 'path';
import pool from './db';

/**
 * Applies schema.sql against the connected database.
 * Every statement uses CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
 * so running this repeatedly is safe.
 */
export async function applySchema(): Promise<void> {
  // When running compiled (dist/migrate.js) __dirname resolves to dist/, so
  // schema.sql lives one level up. When running via ts-node-dev from src/, it
  // also resolves correctly because schema.sql is at the project root.
  const candidates = [
    path.resolve(__dirname, '..', 'schema.sql'),
    path.resolve(__dirname, '..', '..', 'schema.sql'),
  ];
  const schemaPath = candidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(`schema.sql not found in any of: ${candidates.join(', ')}`);
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('📐 Schema applied from', schemaPath);
}

// Direct invocation: `node dist/migrate.js` or `ts-node-dev src/migrate.ts`
if (require.main === module) {
  applySchema()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      pool.end().finally(() => process.exit(1));
    });
}
