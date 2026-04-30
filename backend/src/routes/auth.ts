import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JWT_SECRET } from '../middleware/auth';
import { requireUser, UserAuthRequest } from '../middleware/userAuth';
import { loginLimiter } from '../middleware/loginLimiter';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL = '7d';

function signToken(userId: number): string {
  return jwt.sign({ id: userId, role: 'user' }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// POST /api/auth/signup
router.post('/signup', loginLimiter, async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : '';

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, hash, name || null]
    );
    const user = rows[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/signin
router.post('/signin', loginLimiter, async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// GET /api/auth/me
router.get('/me', requireUser, async (req: UserAuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

export default router;
