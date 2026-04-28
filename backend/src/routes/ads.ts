import { Router, Request, Response } from 'express';
import pool from '../db';

const router = Router();

interface AdRow {
  id: number;
  name: string;
  placement: string;
  ad_type: string;
  image_url: string | null;
  link_url: string | null;
  alt_text: string | null;
  html_content: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
}

function formatAd(ad: AdRow) {
  return {
    id: String(ad.id),
    name: ad.name,
    placement: ad.placement,
    adType: ad.ad_type,
    imageUrl: ad.image_url ?? undefined,
    linkUrl: ad.link_url ?? undefined,
    altText: ad.alt_text ?? undefined,
    htmlContent: ad.html_content ?? undefined,
  };
}

// GET /api/ads/:placement — best active ad for the slot
router.get('/:placement', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM ads
       WHERE placement = $1
         AND is_active = TRUE
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at   IS NULL OR ends_at   >= NOW())
       ORDER BY priority DESC, id DESC
       LIMIT 1`,
      [req.params.placement]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No ad for placement' });
    res.json({ data: formatAd(rows[0]) });
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ error: 'Failed to load ad' });
  }
});

// POST /api/ads/:id/impression — fire-and-forget counter bump
router.post('/:id/impression', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    await pool.query('UPDATE ads SET impressions = impressions + 1 WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Impression error:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
});

// GET /api/ads/:id/click — increments and 302 to link_url (so blockers can't strip it)
router.get('/:id/click', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const { rows } = await pool.query(
      'UPDATE ads SET clicks = clicks + 1 WHERE id = $1 RETURNING link_url',
      [id]
    );
    if (rows.length === 0 || !rows[0].link_url) return res.redirect(302, '/');
    return res.redirect(302, rows[0].link_url);
  } catch (error) {
    console.error('Click error:', error);
    res.redirect(302, '/');
  }
});

export default router;
