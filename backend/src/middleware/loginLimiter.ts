import rateLimit from 'express-rate-limit';

/**
 * Strict per-IP throttle for any login endpoint.
 * 8 attempts per 10 minutes, then 429 with Retry-After.
 *
 * Successful logins still count — we deliberately don't `skipSuccessfulRequests`
 * because credential-stuffing tools also "succeed" some of the time. The limit
 * is generous enough that legitimate users with a typo are unaffected.
 */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
