import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JWT_SECRET, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /login
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
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, username, created_at FROM admin_users WHERE id = $1', [req.adminId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /change-password
router.patch('/change-password', requireAuth, async (req: AuthRequest, res: Response) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both passwords required' });
  if (new_password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE id = $1', [req.adminId]);
    if (!rows[0] || !bcrypt.compareSync(current_password, rows[0].password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const hash = bcrypt.hashSync(new_password, 10);
    await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, req.adminId]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /dashboard
router.get('/dashboard', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const [artRes, vidRes, catRes, tagRes, authRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN is_published = true THEN 1 END) as published, COALESCE(SUM(views), 0) as total_views FROM articles`),
      pool.query('SELECT COUNT(*) as total FROM videos'),
      pool.query('SELECT COUNT(*) as total FROM categories'),
      pool.query('SELECT COUNT(*) as total FROM tags'),
      pool.query('SELECT COUNT(*) as total FROM authors'),
    ]);
    const recentArticles = await pool.query(
      `SELECT a.id, a.title, a.slug, a.is_published, a.published_at, a.views, c.name as category_name
       FROM articles a LEFT JOIN categories c ON a.category_id = c.id
       ORDER BY a.id DESC LIMIT 5`
    );
    const topCategories = await pool.query(
      `SELECT c.name, COUNT(a.id) as article_count FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id GROUP BY c.id, c.name ORDER BY article_count DESC LIMIT 5`
    );
    res.json({
      articles: { total: parseInt(artRes.rows[0].total), published: parseInt(artRes.rows[0].published), drafts: parseInt(artRes.rows[0].total) - parseInt(artRes.rows[0].published), totalViews: parseInt(artRes.rows[0].total_views) },
      videos: { total: parseInt(vidRes.rows[0].total) },
      categories: { total: parseInt(catRes.rows[0].total) },
      tags: { total: parseInt(tagRes.rows[0].total) },
      authors: { total: parseInt(authRes.rows[0].total) },
      recentArticles: recentArticles.rows,
      topCategories: topCategories.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
