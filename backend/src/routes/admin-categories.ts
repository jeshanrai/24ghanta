import { Router, Response } from 'express';
import pool from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * Soft bound used only as a runaway-loop guard inside depth/cycle walks.
 * The DB itself has no depth limit — admins can nest arbitrarily deep.
 * If you ever build trees deeper than this, raise the constant; the recursive
 * CTEs in articles.ts already walk unbounded depth.
 */
const SAFETY_DEPTH = 50;

/* ─── helpers ──────────────────────────────────────────── */

/** Walk up parent chain to compute a node's depth (root = 1). */
type ParentRow = { parent_id: number | null };

/** True if setting `newParentId` on `id` would create a cycle. */
async function wouldCycle(id: number, newParentId: number): Promise<boolean> {
  if (id === newParentId) return true;
  let current: number | null = newParentId;
  for (let i = 0; i < SAFETY_DEPTH; i++) {
    if (current === null) return false;
    if (current === id) return true;
    const result: { rows: ParentRow[] } = await pool.query<ParentRow>(
      'SELECT parent_id FROM categories WHERE id = $1',
      [current]
    );
    if (result.rows.length === 0) return false;
    current = result.rows[0].parent_id;
  }
  return false;
}

/** Validates a candidate parent_id, returns the normalised value or an error. */
async function validateParent(
  selfId: number | null,
  rawParentId: unknown
): Promise<{ value: number | null } | { error: string }> {
  if (rawParentId === null || rawParentId === undefined || rawParentId === '') {
    return { value: null };
  }
  const parentId = typeof rawParentId === 'number' ? rawParentId : parseInt(String(rawParentId), 10);
  if (!Number.isFinite(parentId) || parentId <= 0) {
    return { error: 'parent_id must be a positive integer' };
  }
  if (selfId && parentId === selfId) {
    return { error: 'A category cannot be its own parent' };
  }
  // Parent must exist.
  const { rows } = await pool.query('SELECT id FROM categories WHERE id = $1', [parentId]);
  if (rows.length === 0) return { error: 'Parent category not found' };
  // Cycle check (only meaningful on updates). Depth is unbounded.
  if (selfId && (await wouldCycle(selfId, parentId))) {
    return { error: 'Cannot move a category under one of its own descendants' };
  }
  return { value: parentId };
}

/* ─── routes ───────────────────────────────────────────── */

// GET /api/admin/categories — flat list with article counts + parent_id
router.get('/', requireAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              COUNT(a.id)::int AS article_count
         FROM categories c
         LEFT JOIN articles a ON a.category_id = c.id
         GROUP BY c.id
         ORDER BY c.name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/categories
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, slug, color, parent_id, meta_title, meta_description, meta_keywords } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });

  const parentCheck = await validateParent(null, parent_id);
  if ('error' in parentCheck) return res.status(400).json({ error: parentCheck.error });

  try {
    const { rows } = await pool.query(
      `INSERT INTO categories (name, slug, color, parent_id, meta_title, meta_description, meta_keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, slug, color || null, parentCheck.value, meta_title || null, meta_description || null, meta_keywords || null]
    );
    res.status(201).json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ error: 'Category slug already exists' });
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/categories/:id
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, slug, color, parent_id, meta_title, meta_description, meta_keywords } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required' });

  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const parentCheck = await validateParent(id, parent_id);
  if ('error' in parentCheck) return res.status(400).json({ error: parentCheck.error });

  try {
    const { rows } = await pool.query(
      `UPDATE categories
          SET name = $1, slug = $2, color = $3, parent_id = $4,
              meta_title = $5, meta_description = $6, meta_keywords = $7
        WHERE id = $8
        RETURNING *`,
      [name, slug, color || null, parentCheck.value, meta_title || null, meta_description || null, meta_keywords || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/categories/:id — refuses if children exist
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // ON DELETE RESTRICT on parent_id will already prevent the delete, but a
    // friendly 409 beats a 500 with a Postgres FK error.
    const children = await pool.query(
      'SELECT COUNT(*)::int AS n FROM categories WHERE parent_id = $1',
      [req.params.id]
    );
    if (children.rows[0].n > 0) {
      return res.status(409).json({
        error: 'Cannot delete a category that has subcategories. Move or delete them first.',
      });
    }
    const { rowCount } = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/categories/:id/articles?search=&limit=
 *
 * Articles belonging to the category OR any of its descendants. Match logic
 * mirrors the public articles filter:
 *   - article's primary category_id is the requested id or any descendant, OR
 *   - article is attached via article_categories to the requested id / descendant
 *
 * Drives the right-hand pane on the admin /admin/categories page so the editor
 * can review everything filed under a node without leaving the tree.
 */
router.get('/:id/articles', requireAuth, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);

  try {
    // Collect the requested category id plus every descendant in one query,
    // then use a flat `= ANY($1)` lookup against both the primary FK and the
    // join table. Single CTE, single scan — fast even on deep trees.
    const params: any[] = [id];
    let searchClause = '';
    if (search) {
      params.push(`%${search}%`);
      searchClause = ` AND (a.title ILIKE $${params.length} OR a.excerpt ILIKE $${params.length})`;
    }
    params.push(limit);

    const { rows } = await pool.query(
      `WITH RECURSIVE subtree AS (
         SELECT id FROM categories WHERE id = $1
         UNION ALL
         SELECT c.id FROM categories c JOIN subtree s ON c.parent_id = s.id
       )
       SELECT a.id, a.title, a.slug, a.excerpt, a.image_url, a.published_at,
              a.is_published, a.is_featured, a.is_breaking,
              a.category_id, c.name AS category_name,
              au.name AS author_name
         FROM articles a
         LEFT JOIN categories c ON c.id = a.category_id
         LEFT JOIN authors au ON au.id = a.author_id
        WHERE (
          a.category_id IN (SELECT id FROM subtree)
          OR EXISTS (
            SELECT 1 FROM article_categories ac
             WHERE ac.article_id = a.id
               AND ac.category_id IN (SELECT id FROM subtree)
          )
        )
        ${searchClause}
        ORDER BY a.published_at DESC NULLS LAST, a.id DESC
        LIMIT $${params.length}`,
      params
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('Category articles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
