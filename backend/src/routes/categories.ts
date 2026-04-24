import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, slug, color FROM categories ORDER BY id ASC`
    );
    res.json({
      data: rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        slug: r.slug,
        color: r.color ?? undefined,
      })),
    });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, slug, color FROM categories WHERE slug = $1 LIMIT 1`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    const r = rows[0];
    res.json({
      data: {
        id: String(r.id),
        name: r.name,
        slug: r.slug,
        color: r.color ?? undefined,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to load category' });
  }
});

export default router;
