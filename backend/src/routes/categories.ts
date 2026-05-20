import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/categories — flat list incl. parent_id so callers can build a tree
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, slug, color, parent_id FROM categories ORDER BY id ASC`
    );
    res.json({
      data: rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        slug: r.slug,
        color: r.color ?? undefined,
        parentId: r.parent_id ? String(r.parent_id) : null,
      })),
    });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/categories/nav — categories suitable for the header bar.
// Filters out admin-hidden (show_in_nav=false) and empty categories
// (zero published articles). Ordered by nav_order then name so the bar
// is stable and admin-controlled. CDN-cached for 5 minutes — categories
// don't churn often, and stale-while-revalidate keeps it snappy.
router.get('/nav', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.slug, c.color, c.parent_id, c.nav_order
         FROM categories c
         WHERE COALESCE(c.show_in_nav, TRUE) = TRUE
           AND EXISTS (
             SELECT 1 FROM articles a
              WHERE a.category_id = c.id AND a.is_published = TRUE
              LIMIT 1
           )
         ORDER BY COALESCE(c.nav_order, 0) ASC, c.name ASC`
    );
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.json({
      data: rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        slug: r.slug,
        color: r.color ?? undefined,
        parentId: r.parent_id ? String(r.parent_id) : null,
        navOrder: r.nav_order ?? 0,
      })),
    });
  } catch (error) {
    console.error('Nav categories error:', error);
    res.status(500).json({ error: 'Failed to load nav categories' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, slug, color, parent_id FROM categories WHERE slug = $1 LIMIT 1`,
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
        parentId: r.parent_id ? String(r.parent_id) : null,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to load category' });
  }
});

export default router;
