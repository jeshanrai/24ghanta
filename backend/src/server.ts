import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { applySchema } from './migrate';
import { seedIfEmpty } from './seed';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const AUTO_SEED = process.env.AUTO_SEED !== 'false';
const AUTO_MIGRATE = process.env.AUTO_MIGRATE !== 'false';

// FRONTEND_URL can be a single origin or a comma-separated allow-list.
// VERCEL_PREVIEW=true additionally allows *.vercel.app preview deployments.
const frontendAllowList = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowVercelPreviews = process.env.VERCEL_PREVIEW === 'true';

function isAllowedOrigin(origin: string): boolean {
  if (frontendAllowList.includes(origin)) return true;
  if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

// ── Middleware ──
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, server-to-server, health checks)
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── API Routes ──
app.use('/api', apiRoutes);

// ── Health Check ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── 404 Handler ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Start Server ──
app.listen(PORT, async () => {
  console.log(`\n🚀 24Ghanta API Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`🌐 CORS allow-list: ${frontendAllowList.join(', ')}${allowVercelPreviews ? ' + *.vercel.app' : ''}\n`);

  if (AUTO_MIGRATE) {
    try {
      await applySchema();
    } catch (error) {
      console.error(
        '⚠️  Schema apply failed — database unreachable or permissions missing.',
        error instanceof Error ? error.message : error
      );
    }
  }

  if (AUTO_SEED) {
    try {
      await seedIfEmpty();
    } catch (error) {
      console.error(
        '⚠️  Seed skipped — database unreachable or schema not applied yet.',
        error instanceof Error ? error.message : error
      );
    }
  }
});

export default app;
