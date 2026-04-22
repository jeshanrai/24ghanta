import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || '24ghanta-super-secret-key-change-in-prod';

// POST /api/admin/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    // If DB is not set up, mock the login for development purposes
    if ((error as any).code === '3D000' || (error as any).code === 'ECONNREFUSED' || (error as any).code === '42P01') {
      console.log('Database not fully set up. Using mock admin login fallback.');
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, username: 'admin' });
      } else {
        return res.status(401).json({ error: 'Invalid credentials (Mock Mode)' });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role?: string };
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    try {
      const { rows } = await pool.query('SELECT id, username, created_at FROM admin_users WHERE id = $1', [decoded.id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(rows[0]);
    } catch (dbError) {
      // Mock fallback
      if ((dbError as any).code === '3D000' || (dbError as any).code === 'ECONNREFUSED' || (dbError as any).code === '42P01') {
        return res.json({ id: 1, username: 'admin', created_at: new Date().toISOString() });
      }
      throw dbError;
    }
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
