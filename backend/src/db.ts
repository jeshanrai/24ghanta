import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/24ghantanepal';

// Neon (and most managed Postgres providers) require SSL. Enable it automatically
// when DATABASE_URL points to a non-local host, or when DB_SSL=true is set.
const isLocal = /@(localhost|127\.0\.0\.1|::1)(:|\/|$)/.test(connectionString);
const forceSsl = process.env.DB_SSL === 'true';
const disableSsl = process.env.DB_SSL === 'false';
const useSsl = disableSsl ? false : forceSsl || !isLocal;

const config: PoolConfig = {
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
};

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
