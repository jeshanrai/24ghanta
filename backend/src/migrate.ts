import fs from 'fs';
import path from 'path';
import pool from './db';

/**
 * Applies schema.sql against the connected database.
 * Every statement uses CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS
 * so running this repeatedly is safe.
 */
export async function applySchema(): Promise<void> {
  const schemaPath = path.resolve(__dirname, '..', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql not found at ${schemaPath}`);
  }
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('📐 Schema applied');
}
