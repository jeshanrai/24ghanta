import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT au.*, COUNT(a.id) as article_count FROM authors au LEFT JOIN articles a ON a.author_id = au.id GROUP BY au.id ORDER BY au.name`
    );
    res.json(result.rows);
  } catch (error) { console.error('List authors error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, avatar_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const { rows } = await pool.query('INSERT INTO authors (name, avatar_url) VALUES ($1,$2) RETURNING *', [name, avatar_url || null]);
    res.status(201).json(rows[0]);
  } catch (error) { console.error('Create author error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { name, avatar_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const { rows } = await pool.query('UPDATE authors SET name=$1, avatar_url=$2 WHERE id=$3 RETURNING *', [name, avatar_url || null, req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Author not found' });
    res.json(rows[0]);
  } catch (error) { console.error('Update author error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM authors WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Author not found' });
    res.json({ message: 'Author deleted' });
  } catch (error) { console.error('Delete author error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
