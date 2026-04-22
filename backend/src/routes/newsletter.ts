import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter  — subscribe an email
router.post('/', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }

  try {
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, is_active)
       VALUES ($1, TRUE)
       ON CONFLICT (email)
       DO UPDATE SET is_active = TRUE`,
      [email]
    );
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// POST /api/newsletter/unsubscribe
router.post('/unsubscribe', async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
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

export default router;
