import rateLimit from 'express-rate-limit';

/**
 * Per-route rate limiters for abuse-prone public endpoints. Each is keyed
 * by IP (express-rate-limit's default), which is correct given the global
 * `app.set('trust proxy', 1)` in server.ts — that makes req.ip the real
 * client address behind Render/Vercel's load balancer.
 *
 * Limits are intentionally tight on writes (form submits) and loose on
 * reads. Tune from logs once we have real traffic; these are starting
 * defaults derived from typical abuse patterns, not measured ceilings.
 */

// Contact form: spammers will hammer this if left open. 5/hour per IP is
// generous for genuine users (you'd rarely submit more than one) but cheap
// to detect-and-block when abused.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please try again later.' },
});

// Newsletter subscribe: idempotent (ON CONFLICT DO UPDATE), so spam costs
// us no DB rows, but pings an SMTP if we ever wire confirmation emails.
// 10/hour per IP keeps it cheap.
export const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many subscribe attempts. Please try again later.' },
});

// Poll voting: server-side dedupe on (poll, voter_key) already prevents
// the same browser from voting twice. Rate-limiting on top stops a single
// IP from churning votes across many polls simultaneously.
export const pollVoteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many votes from this address. Please slow down.' },
});

// Uploads: image conversion is CPU-bound (sharp). 30/15min is enough for
// a busy editor and orders of magnitude below what'd DOS the worker.
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Please wait a few minutes.' },
});
