import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Authors can still be listed by anyone signed in (needed for the article form).
// Admin is required for all mutation + credential endpoints.

router.get('/', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT au.id, au.name, au.avatar_url, au.username, au.email, au.is_active, au.created_at,
              COUNT(a.id) AS article_count
         FROM authors au
         LEFT JOIN articles a ON a.author_id = au.id
         GROUP BY au.id
         ORDER BY au.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List authors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, avatar_url, username, email, password } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : null;
  try {
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
    const { rows } = await pool.query(
      `INSERT INTO authors (name, avatar_url, username, email, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, name, avatar_url, username, email, is_active, created_at`,
      [name, avatar_url || null, cleanUsername || null, email || null, passwordHash]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Create author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, avatar_url, username, email, password, is_active } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (password && password.length > 0 && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : null;
  try {
    // Only update password_hash if a new password was provided
    if (password && password.length >= 6) {
      const hash = bcrypt.hashSync(password, 10);
      const { rows } = await pool.query(
        `UPDATE authors
            SET name=$1, avatar_url=$2, username=$3, email=$4, password_hash=$5, is_active=$6
          WHERE id=$7
          RETURNING id, name, avatar_url, username, email, is_active, created_at`,
        [name, avatar_url || null, cleanUsername || null, email || null, hash, is_active !== false, req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Author not found' });
      return res.json(rows[0]);
    }

    const { rows } = await pool.query(
      `UPDATE authors
          SET name=$1, avatar_url=$2, username=$3, email=$4, is_active=$5
        WHERE id=$6
        RETURNING id, name, avatar_url, username, email, is_active, created_at`,
      [name, avatar_url || null, cleanUsername || null, email || null, is_active !== false, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Author not found' });
    res.json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Update author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM authors WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Author not found' });
    res.json({ message: 'Author deleted' });
  } catch (error) {
    console.error('Delete author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
