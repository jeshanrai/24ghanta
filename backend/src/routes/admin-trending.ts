import { Router, Response } from 'express';
import pool from '../db';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

// GET all trending items (admin view — includes inactive)
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM trending_items ORDER BY priority ASC, created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending items' });
  }
});

// POST — create new trending item
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { label, href, priority, badge, is_active, expires_at } = req.body;
    if (!label) return res.status(400).json({ error: 'Label is required' });

    // Auto-assign next priority if not provided
    let prio = priority;
    if (prio === undefined || prio === null) {
      const { rows } = await pool.query('SELECT COALESCE(MAX(priority), 0) + 1 AS next FROM trending_items');
      prio = rows[0].next;
    }

    const { rows } = await pool.query(
      `INSERT INTO trending_items (label, href, priority, badge, is_active, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [label, href || '#', prio, badge || null, is_active !== false, expires_at || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create trending item' });
  }
});

// PUT — update trending item
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { label, href, priority, badge, is_active, expires_at } = req.body;
    const { rows } = await pool.query(
      `UPDATE trending_items SET label=$1, href=$2, priority=$3, badge=$4, is_active=$5, expires_at=$6
       WHERE id=$7 RETURNING *`,
      [label, href || '#', priority || 0, badge || null, is_active !== false, expires_at || null, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trending item' });
  }
});

// PATCH — reorder all items (bulk priority update)
router.patch('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { order } = req.body; // array of { id, priority }
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order array is required' });
    for (const item of order) {
      await pool.query('UPDATE trending_items SET priority=$1 WHERE id=$2', [item.priority, item.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

// PATCH — toggle active status
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE trending_items SET is_active = NOT is_active WHERE id=$1 RETURNING *', [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle' });
  }
});

// DELETE
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM trending_items WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export default router;
