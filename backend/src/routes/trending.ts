import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET active trending items (public — used by the TrendingBar)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, label, href, badge FROM trending_items
       WHERE is_active = true
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY priority ASC`
    );
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending items' });
  }
});

export default router;
