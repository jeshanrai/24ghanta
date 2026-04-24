import { Router, Request, Response } from 'express';
import pool from '../db';
import { mapVideoRow, VIDEO_SELECT, VIDEO_JOIN } from '../mappers';

const router = Router();

const ORDER_BY = `
  ORDER BY
    v.display_order ASC NULLS LAST,
    v.published_at DESC NULLS LAST,
    v.id DESC
`;

// GET /api/videos?limit=8
router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '8', 10) || 8, 100);
  try {
    const { rows } = await pool.query(
      `SELECT ${VIDEO_SELECT}
       FROM videos v
       ${VIDEO_JOIN}
       WHERE v.is_published = TRUE AND (v.type IS NULL OR v.type != 'short')
       ${ORDER_BY}
       LIMIT $1`,
      [limit]
    );
    res.json({ data: rows.map(mapVideoRow), total: rows.length });
  } catch (error) {
    console.error('List videos error:', error);
    res.status(500).json({ error: 'Failed to load videos' });
  }
});

// GET /api/videos/shorts?limit=10
router.get('/shorts', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? '10', 10) || 10, 100);
  try {
    const { rows } = await pool.query(
      `SELECT ${VIDEO_SELECT}
       FROM videos v
       ${VIDEO_JOIN}
       WHERE v.is_published = TRUE
       ${ORDER_BY}
       LIMIT $1`,
      [limit]
    );
    res.json({ data: rows.map(mapVideoRow), total: rows.length });
  } catch (error) {
    console.error('List shorts error:', error);
    res.status(500).json({ error: 'Failed to load shorts' });
  }
});

// GET /api/videos/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${VIDEO_SELECT}
       FROM videos v
       ${VIDEO_JOIN}
       WHERE v.slug = $1 AND v.is_published = TRUE
       LIMIT 1`,
      [req.params.slug]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Video not found' });

    pool.query('UPDATE videos SET views = views + 1 WHERE id = $1', [rows[0].id]).catch(() => {});

    res.json({ data: mapVideoRow(rows[0]) });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to load video' });
  }
});

export default router;
