import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { applySchema } from './migrate';
import { seedIfEmpty } from './seed';
import rateLimit from 'express-rate-limit';

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

// ── Rate Limiting ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── API Routes ──
app.use('/api', apiLimiter, apiRoutes);

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

// ── Global Error Handler ──
// Catches synchronous throws AND rejected promises bubbled up from async
// handlers. Without this, an unhandled rejection would crash the entire process.
// Note: Express requires the 4-arg signature for error middleware.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  // CORS rejection — surface as 403 rather than 500
  if (err instanceof Error && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  console.error('[unhandled]', req.method, req.originalUrl, err);

  // Don't leak internals to clients
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Last-ditch process-level safety nets — log instead of crashing the worker.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
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
