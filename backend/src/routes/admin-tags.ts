import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { loadAuthorPerms } from '../utils/authorPerms';

const router = Router();

// Authors can list tags (for the article form picker) but cannot mutate them.
router.get('/', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT t.*, COUNT(at.article_id) as article_count FROM tags t LEFT JOIN article_tags at ON t.id = at.tag_id GROUP BY t.id ORDER BY t.name`
    );
    res.json(result.rows);
  } catch (error) { console.error('List tags error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, slug, meta_title, meta_description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
  if (req.role === 'author') {
    const perms = await loadAuthorPerms(req.authorId!);
    if (!perms?.can_create_tags) return res.status(403).json({ error: 'You do not have permission to create tags' });
  }
  try {
    const { rows } = await pool.query('INSERT INTO tags (name, slug, meta_title, meta_description) VALUES ($1,$2,$3,$4) RETURNING *', [name, slug, meta_title || null, meta_description || null]);
    res.status(201).json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ error: 'Tag slug already exists' });
    console.error('Create tag error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, slug, meta_title, meta_description } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });
  try {
    const { rows } = await pool.query('UPDATE tags SET name=$1, slug=$2, meta_title=$3, meta_description=$4 WHERE id=$5 RETURNING *', [name, slug, meta_title || null, meta_description || null, req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tag not found' });
    res.json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Update tag error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tags WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Tag not found' });
    res.json({ message: 'Tag deleted' });
  } catch (error) { console.error('Delete tag error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
