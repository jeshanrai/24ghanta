import { Router, Request, Response } from 'express';
import pool from '../db';
import { newUnsubscribeToken } from '../services/newsletter';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter — subscribe an email (idempotent; reactivates if previously inactive)
router.post('/', async (req: Request, res: Response) => {
  const email =
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  try {
    // Generate a token only when we insert a brand-new row; existing rows keep theirs.
    const token = newUnsubscribeToken();
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, is_active, unsubscribe_token)
         VALUES ($1, TRUE, $2)
         ON CONFLICT (email) DO UPDATE
           SET is_active = TRUE,
               unsubscribe_token = COALESCE(newsletter_subscribers.unsubscribe_token, EXCLUDED.unsubscribe_token)`,
      [email, token]
    );
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// POST /api/newsletter/unsubscribe — explicit email-based unsubscribe (legacy / form-based)
router.post('/unsubscribe', async (req: Request, res: Response) => {
  const email =
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  try {
    await pool.query(
      'UPDATE newsletter_subscribers SET is_active = FALSE WHERE email = $1',
      [email]
    );
    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * GET /api/newsletter/unsubscribe?token=…
 *
 * One-click unsubscribe link used in every email footer. Returns a small
 * self-contained HTML page so the flow works even if the frontend is down.
 * No auth — possession of the token is the auth.
 */
router.get('/unsubscribe', async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  let success = false;
  let message = 'Invalid or expired unsubscribe link.';

  if (token) {
    try {
      const { rowCount } = await pool.query(
        'UPDATE newsletter_subscribers SET is_active = FALSE WHERE unsubscribe_token = $1',
        [token]
      );
      if (rowCount && rowCount > 0) {
        success = true;
        message = "You've been unsubscribed. We're sorry to see you go.";
      }
    } catch (err) {
      console.error('Newsletter unsubscribe (token) error:', err);
      message = 'Something went wrong. Please try again later.';
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Unsubscribe — 24 Ghanta Nepal</title>
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:480px;margin:80px auto;padding:32px;background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);text-align:center;">
  <h1 style="margin:0 0 12px;font-size:24px;color:#111;">${success ? 'Unsubscribed' : 'Unsubscribe failed'}</h1>
  <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.55;">${message}</p>
  <a href="${(process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0]}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600;font-size:14px;">Back to 24 Ghanta Nepal</a>
</div>
</body></html>`);
});

export default router;
