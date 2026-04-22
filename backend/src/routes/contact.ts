import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

// POST /api/contact  — submit a contact form
router.post('/', async (req: Request, res: Response) => {
  const name = str(req.body?.name, 120);
  const email = str(req.body?.email, 180).toLowerCase();
  const subject = str(req.body?.subject, 200);
  const message = str(req.body?.message, 5000);

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (message.length < 10) {
    return res.status(400).json({ error: 'Message is too short' });
  }

  try {
    await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, subject, message]
    );
    res.status(201).json({ message: 'Message received. We will get back to you soon.' });
  } catch (error) {
    console.error('Contact submit error:', error);
    res.status(500).json({ error: 'Failed to submit message' });
  }
});

export default router;
