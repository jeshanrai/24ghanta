import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const buildConnectionString = () => {
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || '24ghanta';
  
  const pwd = dbPassword ? `:${dbPassword}` : '';
  return `postgresql://${dbUser}${pwd}@${dbHost}:${dbPort}/${dbName}`;
};

const connectionString = process.env.DATABASE_URL || buildConnectionString();

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
