import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { JWT_SECRET, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /login — tries admin_users first, then authors
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    // Admin?
    const adminRes = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    const admin = adminRes.rows[0];
    if (admin && bcrypt.compareSync(password, admin.password_hash)) {
      const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({
        token,
        username: admin.username,
        role: 'admin',
        id: admin.id,
      });
    }

    // Author?
    const authorRes = await pool.query(
      `SELECT id, name, username, password_hash, is_active, avatar_url
         FROM authors
        WHERE username = $1`,
      [username]
    );
    const author = authorRes.rows[0];
    if (
      author &&
      author.password_hash &&
      author.is_active !== false &&
      bcrypt.compareSync(password, author.password_hash)
    ) {
      const token = jwt.sign({ id: author.id, role: 'author' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({
        token,
        username: author.username,
        name: author.name,
        role: 'author',
        id: author.id,
        avatarUrl: author.avatar_url,
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /me — returns current admin OR author profile
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.role === 'author') {
      const { rows } = await pool.query(
        `SELECT id, name, username, email, avatar_url, is_active, created_at
           FROM authors WHERE id = $1`,
        [req.authorId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Author not found' });
      return res.json({ ...rows[0], role: 'author' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, created_at FROM admin_users WHERE id = $1',
      [req.adminId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ ...rows[0], role: 'admin' });
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

// GET /dashboard — authors only see stats for their own articles
router.get('/dashboard', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isAuthor = req.role === 'author';
    const authorId = req.authorId ?? 0;

    const artParams: unknown[] = isAuthor ? [authorId] : [];
    const artWhere = isAuthor ? 'WHERE author_id = $1' : '';

    const [artRes, vidRes, catRes, tagRes, authRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(CASE WHEN is_published = true THEN 1 END) AS published,
                COALESCE(SUM(views), 0) AS total_views
           FROM articles ${artWhere}`,
        artParams
      ),
      isAuthor
        ? pool.query('SELECT COUNT(*) AS total FROM videos WHERE author_id = $1', [authorId])
        : pool.query('SELECT COUNT(*) AS total FROM videos'),
      isAuthor ? { rows: [{ total: 0 }] } : pool.query('SELECT COUNT(*) AS total FROM categories'),
      isAuthor ? { rows: [{ total: 0 }] } : pool.query('SELECT COUNT(*) AS total FROM tags'),
      isAuthor ? { rows: [{ total: 0 }] } : pool.query('SELECT COUNT(*) AS total FROM authors'),
    ]);

    const recentArticles = await pool.query(
      `SELECT a.id, a.title, a.slug, a.is_published, a.published_at, a.views, c.name AS category_name
         FROM articles a
         LEFT JOIN categories c ON a.category_id = c.id
         ${isAuthor ? 'WHERE a.author_id = $1' : ''}
         ORDER BY a.id DESC LIMIT 5`,
      isAuthor ? [authorId] : []
    );

    const topCategories = await pool.query(
      `SELECT c.name, COUNT(a.id) AS article_count
         FROM categories c
         LEFT JOIN articles a ON a.category_id = c.id
         ${isAuthor ? 'AND a.author_id = $1' : ''}
         GROUP BY c.id, c.name
         ORDER BY article_count DESC LIMIT 5`,
      isAuthor ? [authorId] : []
    );

    res.json({
      role: req.role,
      articles: {
        total: parseInt(artRes.rows[0].total),
        published: parseInt(artRes.rows[0].published),
        drafts: parseInt(artRes.rows[0].total) - parseInt(artRes.rows[0].published),
        totalViews: parseInt(artRes.rows[0].total_views),
      },
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
