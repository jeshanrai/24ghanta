import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/reels — active reels for the public rail
router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, platform, url, caption, sort_order, is_active, created_at, updated_at
       FROM reels
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, id DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('List reels error:', error);
    res.status(500).json({ error: 'Failed to load reels' });
  }
});

export default router;
