import { Router, Response } from 'express';
import pool from '../db';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

// GET / — list all ads
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM ads ORDER BY placement ASC, priority DESC, id DESC'
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('List ads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM ads WHERE id = $1', [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: 'Ad not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /
router.post('/', async (req: AuthRequest, res: Response) => {
  const {
    name,
    placement,
    ad_type,
    image_url,
    link_url,
    alt_text,
    html_content,
    is_active,
    priority,
    starts_at,
    ends_at,
  } = req.body;

  if (!name || !placement) {
    return res.status(400).json({ error: 'Name and placement are required' });
  }
  const type = ad_type === 'html' ? 'html' : 'image';
  if (type === 'image' && !image_url) {
    return res.status(400).json({ error: 'Image URL required for image ads' });
  }
  if (type === 'html' && !html_content) {
    return res.status(400).json({ error: 'HTML content required for html ads' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO ads (name, placement, ad_type, image_url, link_url, alt_text, html_content, is_active, priority, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        name,
        placement,
        type,
        image_url || null,
        link_url || null,
        alt_text || null,
        html_content || null,
        is_active ?? true,
        priority ?? 0,
        starts_at || null,
        ends_at || null,
      ]
    );
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const {
    name,
    placement,
    ad_type,
    image_url,
    link_url,
    alt_text,
    html_content,
    is_active,
    priority,
    starts_at,
    ends_at,
  } = req.body;

  if (!name || !placement) {
    return res.status(400).json({ error: 'Name and placement are required' });
  }
  const type = ad_type === 'html' ? 'html' : 'image';

  try {
    const { rows } = await pool.query(
      `UPDATE ads SET
         name = $1, placement = $2, ad_type = $3, image_url = $4, link_url = $5,
         alt_text = $6, html_content = $7, is_active = $8, priority = $9,
         starts_at = $10, ends_at = $11, updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [
        name,
        placement,
        type,
        image_url || null,
        link_url || null,
        alt_text || null,
        html_content || null,
        is_active ?? true,
        priority ?? 0,
        starts_at || null,
        ends_at || null,
        req.params.id,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ad not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /:id/toggle
router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'UPDATE ads SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ad not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('Toggle ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /:id/reset — reset stats
router.patch('/:id/reset', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'UPDATE ads SET impressions = 0, clicks = 0, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Ad not found' });
    res.json({ data: rows[0] });
  } catch (error) {
    console.error('Reset ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM ads WHERE id = $1', [
      req.params.id,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: 'Ad not found' });
    res.json({ message: 'Ad deleted' });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
