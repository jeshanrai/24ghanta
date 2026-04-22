import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(a.id) as article_count FROM categories c LEFT JOIN articles a ON a.category_id = c.id GROUP BY c.id ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (error) { console.error('List categories error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, slug, color, meta_title, meta_description, meta_keywords } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (name, slug, color, meta_title, meta_description, meta_keywords) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, slug, color || null, meta_title || null, meta_description || null, meta_keywords || null]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ error: 'Category slug already exists' });
    console.error('Create category error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { name, slug, color, meta_title, meta_description, meta_keywords } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });
  try {
    const { rows } = await pool.query(
      'UPDATE categories SET name=$1, slug=$2, color=$3, meta_title=$4, meta_description=$5, meta_keywords=$6 WHERE id=$7 RETURNING *',
      [name, slug, color || null, meta_title || null, meta_description || null, meta_keywords || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Update category error:', error); res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) { console.error('Delete category error:', error); res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
