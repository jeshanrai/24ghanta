import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

const PERM_FIELDS = [
  'is_active',
  'can_publish',
  'can_create_articles',
  'can_create_videos',
  'can_delete_own',
  'can_feature_articles',
  'can_mark_breaking',
  'can_create_tags',
] as const;

const PERM_DEFAULTS: Record<typeof PERM_FIELDS[number], boolean> = {
  is_active: true,
  can_publish: true,
  can_create_articles: true,
  can_create_videos: true,
  can_delete_own: true,
  can_feature_articles: false,
  can_mark_breaking: false,
  can_create_tags: true,
};

function pickPerms(body: Record<string, unknown>) {
  const out: Record<string, boolean> = {};
  for (const k of PERM_FIELDS) {
    out[k] = body[k] === undefined ? PERM_DEFAULTS[k] : body[k] !== false;
  }
  return out;
}

const SELECT_COLS = `
  id, name, avatar_url, username, email,
  is_active, can_publish, can_create_articles, can_create_videos,
  can_delete_own, can_feature_articles, can_mark_breaking, can_create_tags,
  created_at
`;

// Authors can still be listed by anyone signed in (needed for the article form).
// Admin is required for all mutation + credential endpoints.

router.get('/', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT au.id, au.name, au.avatar_url, au.username, au.email,
              au.is_active, au.can_publish, au.can_create_articles, au.can_create_videos,
              au.can_delete_own, au.can_feature_articles, au.can_mark_breaking, au.can_create_tags,
              au.created_at,
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
  const perms = pickPerms(req.body);
  try {
    const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
    const { rows } = await pool.query(
      `INSERT INTO authors
         (name, avatar_url, username, email, password_hash,
          is_active, can_publish, can_create_articles, can_create_videos,
          can_delete_own, can_feature_articles, can_mark_breaking, can_create_tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING ${SELECT_COLS}`,
      [
        name, avatar_url || null, cleanUsername || null, email || null, passwordHash,
        perms.is_active, perms.can_publish, perms.can_create_articles, perms.can_create_videos,
        perms.can_delete_own, perms.can_feature_articles, perms.can_mark_breaking, perms.can_create_tags,
      ]
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
  const { name, avatar_url, username, email, password } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (password && password.length > 0 && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const cleanUsername = typeof username === 'string' ? username.trim().toLowerCase() : null;
  const perms = pickPerms(req.body);
  try {
    const baseParams = [
      name, avatar_url || null, cleanUsername || null, email || null,
      perms.is_active, perms.can_publish, perms.can_create_articles, perms.can_create_videos,
      perms.can_delete_own, perms.can_feature_articles, perms.can_mark_breaking, perms.can_create_tags,
    ];

    if (password && password.length >= 6) {
      const hash = bcrypt.hashSync(password, 10);
      const { rows } = await pool.query(
        `UPDATE authors
            SET name=$1, avatar_url=$2, username=$3, email=$4,
                is_active=$5, can_publish=$6, can_create_articles=$7, can_create_videos=$8,
                can_delete_own=$9, can_feature_articles=$10, can_mark_breaking=$11, can_create_tags=$12,
                password_hash=$13
          WHERE id=$14
          RETURNING ${SELECT_COLS}`,
        [...baseParams, hash, req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Author not found' });
      return res.json(rows[0]);
    }

    const { rows } = await pool.query(
      `UPDATE authors
          SET name=$1, avatar_url=$2, username=$3, email=$4,
              is_active=$5, can_publish=$6, can_create_articles=$7, can_create_videos=$8,
              can_delete_own=$9, can_feature_articles=$10, can_mark_breaking=$11, can_create_tags=$12
        WHERE id=$13
        RETURNING ${SELECT_COLS}`,
      [...baseParams, req.params.id]
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
